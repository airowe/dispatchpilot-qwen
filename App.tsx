import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Send,
  ShieldCheck,
  Zap
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import type { ReactNode } from "react";
import { createDispatchPacket } from "./src/lib/agentEngine";
import { scenarios } from "./src/lib/fixtures";
import type { DispatchAction, DispatchPacket, IncidentInput, Scenario } from "./src/lib/types";

export default function App() {
  const { width } = useWindowDimensions();
  const isWide = width >= 860;
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [note, setNote] = useState(selectedScenario.note);
  const [packet, setPacket] = useState<DispatchPacket | null>(null);
  const [approvedActionIds, setApprovedActionIds] = useState<string[]>([]);
  const [customerUpdateApproved, setCustomerUpdateApproved] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approvedCount = useMemo(() => {
    return packet?.actions.filter((action) => approvedActionIds.includes(action.id)).length ?? 0;
  }, [approvedActionIds, packet]);

  async function runAutopilot() {
    setIsRunning(true);
    setError(null);
    setApprovedActionIds([]);
    setCustomerUpdateApproved(false);

    const input: IncidentInput = {
      note,
      scenarioId: selectedScenario.id,
      reporterRole: "dispatcher"
    };

    try {
      if (apiBaseUrl) {
        const response = await fetch(`${apiBaseUrl}/api/agent/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input)
        });
        if (!response.ok) {
          throw new Error("API run failed");
        }
        const body = (await response.json()) as { packet: DispatchPacket };
        setPacket(body.packet);
      } else {
        setPacket(createDispatchPacket(input));
      }
    } catch {
      setError("API unavailable. Showing local Qwen-shaped demo packet.");
      setPacket(createDispatchPacket(input));
    } finally {
      setIsRunning(false);
    }
  }

  function chooseScenario(scenario: Scenario) {
    setSelectedScenario(scenario);
    setNote(scenario.note);
    setPacket(null);
    setApprovedActionIds([]);
    setCustomerUpdateApproved(false);
    setError(null);
  }

  function toggleAction(action: DispatchAction) {
    setApprovedActionIds((current) =>
      current.includes(action.id) ? current.filter((id) => id !== action.id) : [...current, action.id]
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, isWide ? styles.headerWide : styles.headerNarrow]}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Zap size={22} color={colors.ink} strokeWidth={2.4} />
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.eyebrow}>Qwen Autopilot Agent</Text>
            <Text style={styles.title}>DispatchPilot</Text>
          </View>
        </View>
        <View style={styles.statusPill}>
          <Cloud size={16} color={colors.steel} />
          <Text style={styles.statusText}>{apiBaseUrl ? "API linked" : "Demo mode"}</Text>
        </View>
      </View>

      <View style={[styles.workspace, isWide ? styles.workspaceWide : styles.workspaceNarrow]}>
        <View style={[styles.leftPane, !isWide && styles.leftPaneNarrow]}>
          <SectionLabel icon={<Activity size={18} color={colors.blue} />} title="Incident intake" />
          <View style={styles.scenarioRow}>
            {scenarios.map((scenario) => (
              <Pressable
                key={scenario.id}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedScenario.id === scenario.id }}
                onPress={() => chooseScenario(scenario)}
                style={[styles.scenarioButton, selectedScenario.id === scenario.id && styles.scenarioButtonActive]}
              >
                <Text style={[styles.scenarioButtonText, selectedScenario.id === scenario.id && styles.scenarioButtonTextActive]}>
                  {scenario.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.inputPanel}>
            <Text style={styles.fieldLabel}>Customer</Text>
            <Text style={styles.customerName}>{selectedScenario.customer}</Text>
            <Text style={styles.fieldLabel}>Incident note</Text>
            <TextInput
              accessibilityLabel="Incident note"
              multiline
              value={note}
              onChangeText={setNote}
              style={styles.noteInput}
              textAlignVertical="top"
              placeholder="Paste the field note here"
              placeholderTextColor={colors.muted}
            />
            <Pressable
              accessibilityRole="button"
              onPress={runAutopilot}
              disabled={isRunning}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, isRunning && styles.disabled]}
            >
              {isRunning ? <ActivityIndicator color={colors.white} /> : <Zap size={18} color={colors.white} />}
              <Text style={styles.primaryButtonText}>{isRunning ? "Running" : "Run Autopilot"}</Text>
            </Pressable>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>

        <View style={styles.rightPane}>
          {packet ? (
            <View style={styles.results}>
              <View style={styles.packetHeader}>
                <View>
                  <Text style={styles.eyebrow}>Dispatch packet</Text>
                  <Text style={styles.packetTitle}>{packet.customer}</Text>
                </View>
                <RiskBadge level={packet.risk.level} score={packet.risk.score} />
              </View>

              <View style={[styles.metricGrid, isWide ? styles.metricGridWide : styles.metricGridNarrow]}>
                <Metric icon={<ShieldCheck size={18} color={colors.green} />} label="Crew lead" value={packet.assignment.crewLead} />
                <Metric icon={<Activity size={18} color={colors.blue} />} label="Arrival" value={packet.assignment.arrivalWindow} />
                <Metric icon={<Cloud size={18} color={colors.steel} />} label="Qwen mode" value={packet.qwenMode} />
              </View>

              <View style={styles.sectionBlock}>
                <SectionLabel icon={<Send size={18} color={colors.orange} />} title="Customer update" />
                <Text style={styles.bodyText}>{packet.customerUpdate.draft}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ checked: customerUpdateApproved }}
                  onPress={() => setCustomerUpdateApproved((current) => !current)}
                  style={[styles.secondaryButton, customerUpdateApproved && styles.secondaryButtonActive]}
                >
                  <CheckCircle2 size={17} color={customerUpdateApproved ? colors.white : colors.ink} />
                  <Text style={[styles.secondaryButtonText, customerUpdateApproved && styles.secondaryButtonTextActive]}>
                    {customerUpdateApproved ? "Update approved" : "Approve update"}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.sectionBlock}>
                <SectionLabel icon={<ClipboardCheck size={18} color={colors.green} />} title={`Actions ${approvedCount}/${packet.actions.length}`} />
                <View style={styles.actionList}>
                  {packet.actions.map((action) => (
                    <ActionRow
                      key={action.id}
                      action={action}
                      approved={approvedActionIds.includes(action.id)}
                      onToggle={() => toggleAction(action)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <SectionLabel icon={<AlertTriangle size={18} color={colors.orange} />} title="Memory and audit" />
                {packet.memoryHits.map((memory) => (
                  <Text key={memory} style={styles.bulletText}>
                    {"• "}
                    {memory}
                  </Text>
                ))}
                <View style={styles.auditBox}>
                  {packet.auditTrail.map((entry) => (
                    <Text key={entry} style={styles.auditText}>
                      {entry}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ClipboardCheck size={38} color={colors.steel} />
              <Text style={styles.emptyTitle}>No dispatch packet yet</Text>
              <Text style={styles.emptyText}>Select a scenario, edit the field note, and run the agent.</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function SectionLabel({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <View style={styles.sectionLabel}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <View style={styles.metric}>
      {icon}
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function RiskBadge({ level, score }: { level: DispatchPacket["risk"]["level"]; score: number }) {
  const style = level === "critical" || level === "high" ? styles.riskHigh : level === "medium" ? styles.riskMedium : styles.riskLow;
  return (
    <View style={[styles.riskBadge, style]}>
      <Text style={styles.riskText}>{level.toUpperCase()}</Text>
      <Text style={styles.riskScore}>{score}</Text>
    </View>
  );
}

function ActionRow({ action, approved, onToggle }: { action: DispatchAction; approved: boolean; onToggle: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: approved }}
      onPress={onToggle}
      style={({ pressed }) => [styles.actionRow, approved && styles.actionRowApproved, pressed && styles.pressed]}
    >
      <View style={[styles.checkDot, approved && styles.checkDotActive]}>
        {approved ? <CheckCircle2 size={16} color={colors.white} /> : null}
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionMeta}>
          {action.owner} · {action.eta}
        </Text>
        <Text style={styles.actionReason}>{action.reason}</Text>
      </View>
    </Pressable>
  );
}

function getApiBaseUrl(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv) {
    return stripTrailingSlash(fromEnv);
  }

  if (typeof window !== "undefined") {
    const fromQuery = new URLSearchParams(window.location.search).get("api");
    if (fromQuery) {
      return stripTrailingSlash(fromQuery);
    }
  }

  return undefined;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

const colors = {
  ink: "#17202A",
  text: "#26313D",
  muted: "#657180",
  faint: "#EEF1F4",
  line: "#D9E0E7",
  white: "#FFFFFF",
  blue: "#246BFE",
  green: "#1E8A5A",
  orange: "#B85C00",
  amber: "#F8E7BE",
  red: "#B42318",
  steel: "#596A7A",
  surface: "#F7F8FA"
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface
  },
  content: {
    padding: 20,
    paddingBottom: 44,
    gap: 18,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center"
  },
  header: {
    justifyContent: "space-between",
    gap: 14
  },
  headerWide: {
    flexDirection: "row",
    alignItems: "center"
  },
  headerNarrow: {
    flexDirection: "column",
    alignItems: "flex-start"
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderCurve: "continuous",
    backgroundColor: "#E6F0FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C6DAFF"
  },
  brandCopy: {
    gap: 3
  },
  eyebrow: {
    color: colors.steel,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "800"
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderCurve: "continuous"
  },
  statusText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  workspace: {
    gap: 18,
    alignItems: "stretch"
  },
  workspaceWide: {
    flexDirection: "row"
  },
  workspaceNarrow: {
    flexDirection: "column"
  },
  leftPane: {
    flex: 0.9,
    gap: 12,
    minWidth: 0
  },
  leftPaneNarrow: {
    marginBottom: 14
  },
  rightPane: {
    flex: 1.1,
    minWidth: 0
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800"
  },
  scenarioRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  scenarioButton: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    borderRadius: 999,
    borderCurve: "continuous",
    paddingVertical: 9,
    paddingHorizontal: 12
  },
  scenarioButtonActive: {
    borderColor: colors.blue,
    backgroundColor: "#EAF1FF"
  },
  scenarioButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  scenarioButtonTextActive: {
    color: colors.blue
  },
  inputPanel: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 10
  },
  fieldLabel: {
    color: colors.steel,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  customerName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  noteInput: {
    minHeight: 172,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FBFCFD",
    borderRadius: 8,
    borderCurve: "continuous",
    padding: 12,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21
  },
  primaryButton: {
    height: 48,
    flexShrink: 0,
    borderRadius: 8,
    borderCurve: "continuous",
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 14
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800"
  },
  disabled: {
    opacity: 0.72
  },
  pressed: {
    opacity: 0.82
  },
  errorText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: "700"
  },
  results: {
    gap: 14
  },
  packetHeader: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  packetTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800"
  },
  riskBadge: {
    minWidth: 84,
    borderRadius: 8,
    borderCurve: "continuous",
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center"
  },
  riskHigh: {
    backgroundColor: "#FDE8E5"
  },
  riskMedium: {
    backgroundColor: colors.amber
  },
  riskLow: {
    backgroundColor: "#E4F5EA"
  },
  riskText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900"
  },
  riskScore: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  metricGrid: {
    gap: 10
  },
  metricGridWide: {
    flexDirection: "row"
  },
  metricGridNarrow: {
    flexDirection: "column"
  },
  metric: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    borderCurve: "continuous",
    padding: 13,
    gap: 6
  },
  metricLabel: {
    color: colors.steel,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  metricValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  },
  sectionBlock: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    borderCurve: "continuous",
    padding: 16,
    gap: 12
  },
  bodyText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22
  },
  secondaryButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    borderCurve: "continuous",
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  secondaryButtonActive: {
    backgroundColor: colors.green,
    borderColor: colors.green
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  secondaryButtonTextActive: {
    color: colors.white
  },
  actionList: {
    gap: 10
  },
  actionRow: {
    flexDirection: "row",
    gap: 11,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FBFCFD",
    padding: 12,
    borderRadius: 8,
    borderCurve: "continuous"
  },
  actionRowApproved: {
    borderColor: "#9BD3B6",
    backgroundColor: "#F0FBF4"
  },
  checkDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2
  },
  checkDotActive: {
    backgroundColor: colors.green,
    borderColor: colors.green
  },
  actionCopy: {
    flex: 1,
    gap: 3
  },
  actionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  },
  actionMeta: {
    color: colors.steel,
    fontSize: 13,
    fontWeight: "700"
  },
  actionReason: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18
  },
  bulletText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20
  },
  auditBox: {
    backgroundColor: "#F5F7F8",
    borderRadius: 8,
    borderCurve: "continuous",
    padding: 12,
    gap: 7
  },
  auditText: {
    color: colors.steel,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600"
  },
  emptyState: {
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    borderCurve: "continuous",
    padding: 24,
    gap: 10
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  emptyText: {
    color: colors.steel,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20
  }
});
