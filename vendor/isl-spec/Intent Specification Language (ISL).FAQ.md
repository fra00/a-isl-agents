## FAQ

### General Questions

**Q: What is ISL and who should use it?**

A: ISL (Intent Specification Language) is a structured Markdown format for writing software specifications that LLMs can deterministically convert into code. It's designed for:

- Software architects defining system components
- Developers documenting APIs and UI components
- Teams using AI-assisted development tools
- Anyone who wants specifications that are both human-readable and machine-executable

---

**Q: How is ISL different from traditional documentation?**

A: Traditional docs describe what exists; ISL prescribes what should be built. Key differences:

- **Contracts**: Explicit input/output signatures (like API specs, but for all components)
- **Constraints**: Normative rules that code generators must follow
- **Test Integration**: Acceptance criteria and test scenarios built into spec
- **Determinism**: Canonical rules ensure consistent LLM interpretation

---

**Q: Can ISL be used without LLMs?**

A: Yes! ISL specifications are valuable for human developers as:

- Detailed design documents with clear contracts
- Test plan templates (acceptance criteria → test cases)
- API documentation with examples
- Shared vocabulary (Domain Concepts) for team communication

However, ISL's true power emerges when paired with LLM code generators.

---

**Q: What languages/frameworks does ISL support?**

A: ISL is **language-agnostic**. The same specification can generate:

- Frontend: React, Vue, Svelte, Angular
- Backend: Node.js, Python, Java, Go, Rust
- Mobile: React Native, Flutter, Swift

The spec describes _behavior_, not _implementation_. Implementation Hints can suggest preferred tech stack.

---

### Writing ISL Specs

**Q: How much detail should I include?**

A: Follow the "Goldilocks Principle":

- **Too little**: Vague contracts → non-deterministic output
- **Too much**: Implementation details → inflexible, harder to maintain
- **Just right**: Clear contracts, measurable constraints, suggested strategies

**Rule of thumb**: Include enough for someone (or an LLM) to implement it correctly on first try, without dictating _how_ to implement.

---

**Q: When should I use Flow vs just Contract?**

A: Use **Flow** when:

- Multi-step process (login, checkout, wizard)
- Branching logic (IF/ELSE conditions)
- Integration with multiple services
- Complex algorithm or transformation

Omit **Flow** when:

- Single atomic operation ("toggle boolean", "return value")
- Contract is self-explanatory ("Validate email format")
- Implementation is trivial

---

**Q: How do I handle optional features?**

A: Three approaches:

1. **Optional Section**: Mark entire capability as future enhancement

   ```markdown
   ⚡ Capabilities

   #### exportPDF (OPTIONAL)

   **Contract**: Generate PDF report
   → May be omitted in MVP, but if implemented must follow this spec
   ```

2. **Conditional Constraint**: Use SHOULD instead of MUST

   ```
   🚨 Constraint:
   - MUST validate email format
   - SHOULD send confirmation email (if EmailService available)
   ```

``**Q: Can I reference other ISL documents?**  A: Yes, using explicit references: ````markdown ## Domain Concepts (see: `domain-model.isl.md`) OR  ### Product **Identity**: UUID **Properties**: (as defined in ProductCatalog component spec) **Relationships**: - Referenced by CartItem (see: CartService specification) ```` For large projects, consider: - One ISL file per subsystem - Shared `domain-concepts.isl.md` imported by all - Index file listing all components``

### Canonical Rules

**Q: What happens if my specification violates a Canonical Rule?**

A: Depends on the LLM implementation:

- **Compliant LLM**: Should report error and request clarification
- **Best-effort LLM**: May generate code but warn about violation
- **Non-compliant LLM**: May silently ignore (not recommended)

**Example violations:**

```markdown
❌ VIOLATION (Rule 4):
Component: UserButton
Role: Presentation
⚡ validateUserPermissions
Flow: Check database for user.role
→ Presentation accessing database directly

→ Compliant LLM should reject or request clarification
```

---

**Q: Can I extend ISL with custom sections?**

A: Yes! ISL is designed for extensibility. You can add:

```markdown
### 🔒 Security Considerations (CUSTOM)

- Authentication required: Yes
- Authorization: Admin role only
- Data encryption: At rest and in transit

### 📊 Analytics Tracking (CUSTOM)

- Track event: "user_login"
- Properties: {method: "email" | "oauth", provider: string}
```

**Guidelines for custom sections:**

- Use unique emoji to differentiate from standard ISL
- Document meaning in project README
- Keep custom sections (OPTIONAL) to maintain spec portability

---

**Q: How do I handle breaking changes in Canonical Rules?**

A: Canonical Rules are versioned independently from ISL template:

```markdown
# ISL Canonical Rules v1.6

(rules defined here)

# ISL Canonical Rules v2.0 (hypothetical future)

## Breaking Changes from v1.6:

- Rule 4 now requires explicit data flow diagrams for Backend components
```

When rules change:

1. Documents specify which Canonical Rules version they follow
2. LLMs must support multiple rule versions
3. Migration guides provided for upgrading specs

---

### LLM Code Generation

**Q: How do I ensure deterministic code generation?**

A: Follow these practices:

1. **Explicit Domain Concepts**: Define all entity names, types
2. **Complete Contracts**: Include input/output signatures
3. **Measurable Constraints**: Use numbers, not adjectives ("< 200ms" not "fast")
4. **Comprehensive Test Scenarios**: Cover happy path, errors, edge cases
5. **Clear Implementation Hints**: Suggest specific libraries/patterns

**Verification test:**

```bash
# Generate code 10 times
for i in {1..10}; do
  llm generate spec.isl.md > output_$i.js
done

# Compare outputs (should be semantically identical)
diff output_1.js output_2.js
```

---

**Q: What if the LLM generates code that violates constraints?**

A: This indicates either:

1. **Specification ambiguity**: Constraint not clear enough
2. **LLM non-compliance**: LLM not following Canonical Rules
3. **Constraint impossibility**: Technical limitation

**Solutions:**

- Refine constraint with more specificity
- Add Implementation Hint showing how to satisfy constraint
- If constraint is impossible, relax it (MUST → SHOULD)

**Example:**

````markdown
❌ VAGUE CONSTRAINT:
🚨 Constraint: Must be secure

✅ SPECIFIC CONSTRAINT:
🚨 Constraint:

- Passwords MUST be hashed with bcrypt (cost factor ≥ 12)
- Session tokens MUST be cryptographically random (≥ 256 bits entropy)
- API keys MUST NOT be logged or exposed in error messages

💡 Implementation Hint:

```javascript
// Use crypto.randomBytes for tokens
const token = crypto.randomBytes(32).toString("hex"); // 256 bits
```
````

````
---

**Q: Can ISL specifications be version-controlled?**

A: Absolutely! ISL documents are plain Markdown, perfect for Git:

```bash
# Example repository structure
/specs
  /domain
    domain-concepts.isl.md
  /frontend
    user-profile-card.isl.md
    login-form.isl.md
  /backend
    auth-service.isl.md
    payment-service.isl.md
  README.md (ISL version, conventions)
````

**Benefits:**

- Track specification evolution over time
- Review specification changes via pull requests
- Link commits to issues/tickets
- Generate diffs to see exactly what changed

---

### Integration & Tooling

**Q: Are there tools to validate ISL specifications?**

A: As of ISL v1.6, reference tools are in development. Planned tools:

1. **ISL Linter**: Check structure, required sections
2. **Canonical Rules Validator**: Verify compliance with rules
3. **Contract Checker**: Ensure input/output types are consistent
4. **Test Generator**: Extract test scenarios into test files

Community contributions welcome!

---

**Q: How do I integrate ISL with my development workflow?**

A: Common integration patterns:

**Pattern 1: Spec-First Development**

Write ISL specification
Generate initial code with LLM
Implement tests based on Acceptance Criteria
Refine code to pass tests
Update ISL spec if requirements change

**Pattern 2: Documentation-Driven**

Write ISL spec as design document
Team reviews and approves spec
Developers implement manually (using spec as guide)
Tests derived from Test Scenarios
Spec serves as living documentation

**Pattern 3: Hybrid**

Write ISL spec
Generate boilerplate/scaffolding with LLM
Implement business logic manually
LLM generates tests from spec
CI/CD runs tests on every commit

---

**Q: Can ISL be used for legacy code documentation?**

A: Yes! Reverse engineering process:

1. **Analyze existing code** → identify components and their behaviors
2. **Extract contracts** → what does each function/component actually do?
3. **Document constraints** → what rules does code enforce?
4. **Write test scenarios** → based on existing tests or behavior
5. **Refine spec** → clarify ambiguities, add missing details

**Benefits:**

- Creates maintainable documentation for legacy systems
- Enables gradual refactoring (spec defines target state)
- Facilitates knowledge transfer to new team members

---

### Advanced Usage

**Q: How do I specify performance requirements?**

A: Use measurable constraints with percentiles:

```markdown
🚨 Constraint:
**Performance:**

- Response time MUST be < 200ms (p95)
- Response time MUST be < 100ms (p50)
- Throughput MUST support 1000 requests/second
- Memory usage MUST NOT exceed 512MB (p99)

**Scalability:**

- System MUST handle 10,000 concurrent users
- Database queries MUST complete in < 50ms (p95)

💡 Implementation Hint:

- Use connection pooling (max 100 connections)
- Implement query result caching (TTL: 5 minutes)
- Consider horizontal scaling for > 5000 users
```

---

**Q: How do I handle multi-language/i18n requirements?**

A: Specify at component and capability level:

```markdown
Component: UserGreeting
Role: Presentation

🚨 Global Constraints:

- Component MUST support i18n (internationalization)
- All user-facing text MUST be translatable
- Supported languages: en, es, fr, de, ja

⚡ displayGreeting

**Contract**: Show personalized greeting in user's language

**Flow**:

1. Get user's preferred language (user.locale)
2. Load translation string for "greeting"
3. Interpolate user's name into translated template
4. Render greeting

💡 Implementation Hint:

- Use react-i18next or similar library
- Translation keys: "greeting.hello" → "Hello, {{name}}!"
- Fallback to English if translation missing

🧪 Test Scenarios:

1. **English User**: locale="en" → "Hello, John!"
2. **Spanish User**: locale="es" → "¡Hola, John!"
3. **Unsupported Locale**: locale="pt" → fallback to "Hello, John!"
```

---

**Q: Can ISL specify database schemas?**

A: Yes, using Backend components:

```markdown
Component: UserTable
Role: Backend (Data)

### 📐 Interface

**Table Name**: users
**Primary Key**: id (UUID)

**Schema**:
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(60) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |
| last_login | TIMESTAMP | NULL |

**Indexes**:

- `idx_users_email` ON email (UNIQUE)
- `idx_users_created_at` ON created_at

🚨 Constraints:

- Email MUST be unique (enforced at database level)
- password_hash MUST be bcrypt hash (enforced at application level)

💡 Implementation Hint:

- Use PostgreSQL 14+ (for gen_random_uuid())
- Consider partitioning by created_at if > 10M rows
```
