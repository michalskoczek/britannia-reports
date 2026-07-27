/**
 * Contract every PDF-fidelity fixture satisfies.
 *
 * A fixture records one reachable form state for one report type. `apply` must reach that state the
 * way the UI reaches it — driving the component's own array-building methods before patching values
 * — so a captured reference PDF never describes a state a teacher could not produce.
 *
 * See `docs/pdf-fidelity-check.md` for how these fixtures are used.
 */
export interface ReportFixture<TComponent> {
  /** Kebab-case identifier. Doubles as the filename when the fixture is captured to a PDF. */
  readonly id: string;

  /** Human-readable description of the recorded state. */
  readonly label: string;

  /** Brings a freshly created component into the recorded state. */
  apply(component: TComponent): void;
}
