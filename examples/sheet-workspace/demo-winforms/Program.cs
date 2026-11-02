using SheetWorkspace;

namespace SheetWinForms;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new AppShell());
    }
}
