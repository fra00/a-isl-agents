using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace TariffeV2.Score;

public static class Program
{
    public static int Main(string[] args)
    {
        if (args.Length < 3)
        {
            Console.Error.WriteLine("usage: TariffeScore <binDir> <vectors.json> <call-map.json>");
            return 2;
        }

        var binDir = Path.GetFullPath(args[0]);
        var vectorsPath = Path.GetFullPath(args[1]);
        var callMapPath = Path.GetFullPath(args[2]);

        var vectorsDoc = JsonNode.Parse(File.ReadAllText(vectorsPath))!;
        var vectors = vectorsDoc["vectors"]!.AsArray();
        var mapOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var callMap = JsonSerializer.Deserialize<Dictionary<string, CallEntry>>(
            File.ReadAllText(callMapPath),
            mapOpts
        )!;

        var jsonOpts = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
            WriteIndented = false,
        };

        var asm = Assembly.GetExecutingAssembly();
        var failed = new JsonArray();
        var missingExport = new JsonArray();
        int passed = 0;
        int visiblePass = 0, visibleTotal = 0;
        int holdoutPass = 0, holdoutTotal = 0;
        int holdoutHandPass = 0, holdoutHandTotal = 0;
        int holdoutOdPass = 0, holdoutOdTotal = 0;

        var methodCache = new Dictionary<string, MethodInfo?>(StringComparer.Ordinal);

        foreach (var v in vectors)
        {
            var id = v!["id"]!.GetValue<string>();
            var unit = v["unit"]!.GetValue<string>();
            var call = v["call"]!.GetValue<string>();
            var visible = v["visible"]?.GetValue<bool>() ?? false;
            var provenance = v["provenance"]?.GetValue<string>() ?? "hand";
            var key = $"{unit}.{call}";

            if (visible) visibleTotal++;
            else
            {
                holdoutTotal++;
                if (provenance == "hand") holdoutHandTotal++;
                else holdoutOdTotal++;
            }

            if (!callMap.TryGetValue(key, out var entry))
            {
                missingExport.Add(new JsonObject
                {
                    ["id"] = id,
                    ["unit"] = unit,
                    ["call"] = call,
                    ["reason"] = "call_map_missing",
                });
                continue;
            }

            var filePath = Path.Combine(binDir, entry.File);
            if (!File.Exists(filePath))
            {
                missingExport.Add(new JsonObject
                {
                    ["id"] = id,
                    ["unit"] = unit,
                    ["call"] = call,
                    ["reason"] = "file_missing",
                });
                continue;
            }

            var cacheKey = $"{entry.File}::{entry.Export}";
            if (!methodCache.TryGetValue(cacheKey, out var method))
            {
                method = FindStaticMethod(asm, entry.Export);
                methodCache[cacheKey] = method;
            }

            if (method is null)
            {
                missingExport.Add(new JsonObject
                {
                    ["id"] = id,
                    ["unit"] = unit,
                    ["call"] = call,
                    ["reason"] = "missing_export",
                });
                continue;
            }

            try
            {
                var inputJson = v["input"]!.ToJsonString();
                object? arg0;
                var pType = method.GetParameters()[0].ParameterType;
                if (pType == typeof(JsonElement))
                {
                    arg0 = JsonSerializer.Deserialize<JsonElement>(inputJson, jsonOpts);
                }
                else if (pType == typeof(JsonNode) || pType == typeof(JsonObject))
                {
                    arg0 = JsonNode.Parse(inputJson);
                }
                else
                {
                    arg0 = JsonSerializer.Deserialize(inputJson, pType, jsonOpts);
                }

                var raw = method.Invoke(null, new[] { arg0 });
                string actualJson;
                if (raw is JsonNode jn)
                    actualJson = jn.ToJsonString(jsonOpts);
                else if (raw is JsonElement je)
                    actualJson = je.GetRawText();
                else
                    actualJson = JsonSerializer.Serialize(raw, jsonOpts);

                var actualNode = JsonNode.Parse(actualJson)!;
                var expectedNode = v["expected"]!;

                if (!JsonNode.DeepEquals(Normalize(actualNode), Normalize(expectedNode)))
                {
                    failed.Add(new JsonObject
                    {
                        ["id"] = id,
                        ["reason"] = "wrong_answer",
                        ["expected"] = expectedNode.DeepClone(),
                        ["actual"] = actualNode,
                    });
                    continue;
                }

                passed++;
                if (visible) visiblePass++;
                else
                {
                    holdoutPass++;
                    if (provenance == "hand") holdoutHandPass++;
                    else holdoutOdPass++;
                }
            }
            catch (Exception ex)
            {
                var inner = ex is TargetInvocationException tie && tie.InnerException != null
                    ? tie.InnerException
                    : ex;
                failed.Add(new JsonObject
                {
                    ["id"] = id,
                    ["reason"] = "wrong_answer",
                    ["expected"] = v["expected"]!.DeepClone(),
                    ["actual"] = new JsonObject { ["threw"] = inner.ToString() },
                });
            }
        }

        double? Rate(int p, int t) => t == 0 ? null : (double)p / t;

        var report = new JsonObject
        {
            ["stack"] = "csharp",
            ["binDir"] = binDir,
            ["passed"] = passed,
            ["total"] = vectors.Count,
            ["visiblePassRate"] = Rate(visiblePass, visibleTotal),
            ["holdoutPassRate"] = Rate(holdoutPass, holdoutTotal),
            ["holdoutPassRateHand"] = Rate(holdoutHandPass, holdoutHandTotal),
            ["holdoutPassRateOracleDerived"] = Rate(holdoutOdPass, holdoutOdTotal),
            ["visibleTotal"] = visibleTotal,
            ["holdoutTotal"] = holdoutTotal,
            ["holdoutHandTotal"] = holdoutHandTotal,
            ["holdoutOdTotal"] = holdoutOdTotal,
            ["failed"] = failed,
            ["missing_export"] = missingExport,
            ["verifyNote"] = "EXT-001 dotnet test is separate; see build/verify-status.json",
        };

        Console.WriteLine(report.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));
        return failed.Count + missingExport.Count == 0 ? 0 : 1;
    }

    static MethodInfo? FindStaticMethod(Assembly asm, string name)
    {
        foreach (var t in asm.GetTypes())
        {
            if (!t.IsClass || !t.IsPublic) continue;
            if (t.Namespace == "TariffeV2.Score") continue;
            var matches = t.GetMethods(BindingFlags.Public | BindingFlags.Static)
                .Where(x => x.Name == name && x.GetParameters().Length == 1)
                .ToArray();
            if (matches.Length >= 1) return matches[0];
        }
        return null;
    }

    static JsonNode Normalize(JsonNode node)
    {
        // Drop null properties so C# DTO serialization (code:null) matches JS sparse objects.
        if (node is JsonObject obj)
        {
            var ordered = new JsonObject();
            foreach (var kv in obj.OrderBy(k => k.Key, StringComparer.Ordinal))
            {
                if (kv.Value is null || kv.Value.GetValueKind() == JsonValueKind.Null)
                    continue;
                ordered[kv.Key] = Normalize(kv.Value);
            }
            return ordered;
        }
        if (node is JsonArray arr)
        {
            var next = new JsonArray();
            foreach (var item in arr)
                next.Add(item is null ? null : Normalize(item));
            return next;
        }
        return node.DeepClone();
    }

    sealed class CallEntry
    {
        public string File { get; set; } = "";
        public string Export { get; set; } = "";
    }
}
