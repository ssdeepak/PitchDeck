# DSL Grammar Reference (Initial Extract)

Status: Working reference derived from existing examples (Blackjack, Scriptwriting, Smart Home) and interpreter capabilities. A future automated generator will output a machine-readable schema.

## 1. Program Structure
Element | Description | Required Attributes | Optional Attributes
------- | ----------- | ------------------- | ------------------
PLAN | Root container defining scope & metadata | `Key` | `Description`, `Author`
AGENT | Modular logic / orchestration / tool unit | `Key` | `Purpose`, custom metadata
SCHEMA | Collection of TABLE / ENUM definitions | — | —
STORE | Logical storage/asset namespace | `Key` | —
FOLDER | Folder inside STORE | `Key` | —
FILE | File/asset definition | `Key`, `Type` | `Content`, `Vectorized`

## 2. Data Modeling Constructs
Element | Purpose | Key Attributes
------- | ------- | --------------
TABLE | Domain entity/table definition | `Key`, `Plural`
COLUMN | Field definition inside TABLE | `Key`, `Type`, `IsRequired`
ENUM | Enumerated type container | `Key`
VALUE | Enumeration member | `Key`, `Content`

Supported Column Types (current usage): `UNIQ`, `STRING`, `INTEGER`, `DOUBLE`, `BOOL`, `DATETIME`, `ONE`, `MANY` (with `ForeignType` for relationships).

## 3. Variable & Declaration Layer
Element | Purpose | Attributes
------- | ------- | ----------
DECLARE | Declare variable local to agent | `Key`, `Type`, optional `Expression`
PROP | Declare structured input property (binding to foreign composite or simple type) | `Key`, `Type`, optional `ForeignType`
ASSIGN | Update variable value via template arithmetic/expression | `Key`, `Template`
RETURN | Return value from agent (with `Type`) | `Template`

## 4. Control Flow
Element | Purpose | Attributes
------- | ------- | ----------
IF | Conditional branch | `Key` (variable), `ConditionType`, `Template` (comparison target)
THEN / ELSE | Branch containers | —
WHILE | Loop until condition false | `Key`, `ConditionType`, `Template`
SWITCH | Multi-branch selection | `Key`
CASE | Case branch under SWITCH | `Template`
FOR / FOREACH | (Planned / partially prototyped) iterative constructs | TBD

Common `ConditionType` values: `Equal`, `NotEqual`, `GreaterThan`, `LessThan`, `LessThanOrEqual`, `GreaterThanOrEqual`.

## 5. Interaction & UI Semantics
Element | Purpose | Key Attributes
------- | ------- | --------------
OUT | Emit textual feedback / output | `Template`
IN | Solicit user input | `Key`, `Type` (`TEXT`, `TEXTAREA`, `CHOICE`, `INTEGER`), optional `Label`, `Preset`
CHOICE | Define selectable options | `Key`
PICK | Choice option | `Key`, `Description`
LIST | Render tabular/card list from collection | `Key`, `CollectionSource`, `Type` (`TABLE`/`CARDS`), `Keys`
FORM | Structured input for multiple fields | `Key`, `Keys`
DETAIL | Display structured info | `DataSource`, `Keys`, `Type`
RENDER | Visual rendering directive | `Key`, `Type` (`IMAGE`, etc.)

## 6. AI / Prompt Orchestration
Element | Purpose | Attributes
------- | ------- | ----------
PROMPT | Define structured prompt with sections | `Key`
SECTION | Segment inside PROMPT | `Type` (`system`/`user`/`assistant`)
LINE | Individual line; may contain `Template` with substitutions | `Template`
GENERATE | Execute model generation | `Key`, `Keys` (prompt references), `MaxTokens`, `Creativity`

Creativity Modes (currently observed): `Creative`, `Focused` (mapped to model temperature / style presets internally).

## 7. Integration & Data Access
Element | Purpose | Attributes
------- | ------- | ----------
FETCH | External API call | `Key`, `Verb` (`ONE`/`MANY`/`POST`), `Endpoint`, optional `Inputs`
READ | Load file content | `Key`, `FileKey`
WRITE | Persist values to file | `Key` (comma-separated variable list), `FileKey`

## 8. Analytics
Element | Purpose | Attributes
------- | ------- | ----------
ANALYZE | Run analytic primitive | `Key`, `DataSources`, `AnalysisType`, `Algorithm`, `OutputFormat`, `Confidence`

Indicative `AnalysisType`: `TREND_ANALYSIS`, `KPI_CALCULATOR`, `AGGREGATION`, `PERFORMANCE`.

## 9. IoT & Actuation
Element | Purpose | Attributes
------- | ------- | ----------
SENSE | Acquire sensor reading | `Key`, `SensorType`, `Endpoint`, `Frequency`, `Precision`, `Units`
ACTUATE | Trigger device action | `Key`, `DeviceType`, `Endpoint`, `Parameters`, `Duration`, `Safety`

Frequencies: `ON_DEMAND`, `CONTINUOUS`, `PERIODIC`. Precision: `HIGH`, `MEDIUM`.

## 10. Knowledge / Retrieval
Element | Purpose | Attributes
------- | ------- | ----------
STORE | Logical container (see above) | `Key`
FOLDER | Group assets | `Key`
FILE | Asset metadata | `Key`, `Type`, `Content`, `Vectorized`

`Vectorized=true` indicates inclusion in retrieval / embedding pipelines.

## 11. Execution Semantics Overview
- Variables resolve via `#Var#` substitution.
- Expressions inside `ASSIGN` support simple arithmetic and variable references.
- Agent calls (`CALL`) pass variables (`Variables="A,B"`) or structured props.
- Return values propagate into the caller’s assigned variable.

## 12. Error & Validation Rules (Current)
Rule | Enforcement
---- | -----------
Duplicate Variable Keys | Rejected / autofix rename pass (planned deterministic suffix)
Unbalanced IF / THEN / ELSE | Prevented at parse layer
Missing RETURN for consumed agent output | Warn (future), silent accept now
Unknown Column Type | Fallback to STRING (future explicit error)
Invalid ConditionType | Parse error

## 13. Planned Grammar Extensions
Category | Planned Additions | Rationale
-------- | ----------------- | ---------
Events | `EVENT` emission statement (prototype textual) | Explicit domain event surfacing
Workflow | `PARALLEL`, `BRANCH` | Concurrency + clarity
Data | `INDEX`, `RELATION` | Richer modeling for downstream DB transpilers
Security | `POLICY`, `ROLE`, `GUARD` | Policy DSL integration
Testing | `ASSERT`, `EXPECT` | In-DSL test harness for simulation
Scheduling | `CRON`, `DELAY` | Time-based orchestration

## 14. Sample Consolidated Snippet (Annotated)
```xml
<PLAN Key="SmartHomeSystem" Description="IoT Smart Home Automation" Author="IoT Engineer">
  <SCHEMA>
    <TABLE Key="Device" Plural="Devices">
      <COLUMN Key="ID" Type="UNIQ" IsRequired="true" />
      <COLUMN Key="Name" Type="STRING" IsRequired="true" />
      <COLUMN Key="Type" Type="ONE" ForeignType="DeviceType" />
    </TABLE>
    <ENUM Key="DeviceType">
      <VALUE Key="Sensor" Content="Sensor Device" />
    </ENUM>
  </SCHEMA>
  <AGENT Key="SmartHomeOrchestrator" Purpose="Orchestrator">
    <DECLARE Key="UserChoice" Type="STRING" />
    <CHOICE Key="MainMenu">
      <PICK Key="monitor" Description="Monitor sensors" />
      <PICK Key="exit" Description="Exit system" />
    </CHOICE>
    <WHILE Key="UserChoice" ConditionType="NotEqual" Template="exit">
      <IN Key="UserChoice" Option="MainMenu" Type="CHOICE" Label="Select option:" />
      <SWITCH Key="UserChoice">
        <CASE Template="monitor">
          <CALL ToKey="EnvironmentMonitorAgent" Variables="CurrentRoom" />
        </CASE>
      </SWITCH>
    </WHILE>
  </AGENT>
</PLAN>
```

## 15. Future Machine-Readable Schema
Roadmap includes automatic export to JSON Schema / OpenAPI-like contract enabling IDE autocomplete, validation, and transpiler contract tests.

---
**Living Reference** – update with every grammar token addition or interpreter capability increment.
