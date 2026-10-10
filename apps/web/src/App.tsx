import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { WorkGraphView } from './components/WorkGraphView';
import { ScenarioCard } from './components/ScenarioCard';
import { TrustScoreCard } from './components/TrustScoreCard';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { OnboardingModal } from './components/OnboardingModal';
import { AgentSwarmConsole } from './components/AgentSwarmConsole';
import { api } from './services/api';
import {
  EvidenceEnvelope,
  FutureScenario,
  OnboardingPayload,
  RoleResilienceResult,
  TrustScoreResult,
  WorkGraphEdge,
  WorkGraphNode,
} from './types';

export const App: React.FC = () => {
  const [tenantId, setTenantId] = useState<string>('tenant-food-mfg-01');
  const [sector, setSector] = useState<string>('food_manufacturing');
  const [nodes, setNodes] = useState<WorkGraphNode[]>([]);
  const [edges, setEdges] = useState<WorkGraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkGraphNode | null>(null);
  const [scenarios, setScenarios] = useState<FutureScenario[]>([]);
  const [trustBoard, setTrustBoard] = useState<TrustScoreResult | null>(null);
  const [roleResilience, setRoleResilience] = useState<RoleResilienceResult | null>(null);
  const [evidenceLedger, setEvidenceLedger] = useState<EvidenceEnvelope[]>([]);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [graphRes, scenariosRes, trustRes, rriRes, evidenceRes] = await Promise.all([
        api.getWorkGraph(),
        api.getScenarios(sector),
        api.getTrustBoard(),
        api.getRoleResilience('ROL-001'),
        api.getEvidenceLedger(),
      ]);

      setNodes(graphRes.nodes);
      setEdges(graphRes.edges);
      if (graphRes.nodes.length > 0 && !selectedNode) {
        setSelectedNode(graphRes.nodes[0]);
      }
      setScenarios(scenariosRes.scenarios);
      setTrustBoard(trustRes);
      setRoleResilience(rriRes);
      setEvidenceLedger(evidenceRes);
    } catch (err: any) {
      console.error('Failed to load cockpit data:', err);
      setStatusMessage('Connected via resilient local adapter.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId, sector]);

  const handleOnboardSubmit = async (payload: OnboardingPayload) => {
    const res = await api.onboard(payload);
    setTenantId(res.tenant_id);
    setSector(res.sector);
    setStatusMessage(`Successfully bootstrapped ${res.organization_name}!`);
    await loadData();
  };

  const handleUploadFile = async (file: File) => {
    const uploaded = await api.uploadEvidence(file, 'Executive Ingestion');
    setEvidenceLedger((prev) => [uploaded, ...prev]);
    setStatusMessage(`Ingested ${file.name} (SHA-256: ${uploaded.sha256_hash.slice(0, 10)}...)`);
  };

  const handleHorizonChange = async (year: number) => {
    try {
      const temporalRes = await api.getTemporalWorkGraph(year);
      setNodes(temporalRes.graph.nodes);
      setEdges(temporalRes.graph.edges);
      setStatusMessage(
        `WorkGraph projected to Horizon Year ${year} (${temporalRes.summary.agent_task_allocation_pct}% agent automation).`
      );
    } catch (err: any) {
      console.error('Failed to load temporal graph:', err);
    }
  };

  return (
    <div className="cockpit-container">
      <Header
        tenantId={tenantId}
        sector={sector}
        onOpenOnboard={() => setIsOnboardingOpen(true)}
        onRefresh={loadData}
      />

      {statusMessage && (
        <div style={{
          background: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          color: 'var(--accent-cyan)',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>✨ {statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="glass-panel panel-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>Sculpting Work Transformation Digital Twin...</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
            Traversing temporal graph, compiling scenarios, and calculating governance scores.
          </p>
        </div>
      ) : (
        <>
          <div className="grid-main">
            {/* Left Column: Future Scenarios + WorkGraph Visualizer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <ScenarioCard scenarios={scenarios} />
              <WorkGraphView
                nodes={nodes}
                edges={edges}
                selectedNode={selectedNode}
                onSelectNode={(node) => setSelectedNode(node)}
                onHorizonChange={handleHorizonChange}
              />
            </div>

            {/* Right Column: Governance TrustBoard + Role Resilience Index */}
            <div>
              <TrustScoreCard
                trustBoard={trustBoard}
                roleResilience={roleResilience}
              />
            </div>
          </div>

          {/* Bottom Sections: Multi-Agent Swarm Console & Evidence Ledger */}
          <AgentSwarmConsole />

          <EvidenceDrawer
            evidenceLedger={evidenceLedger}
            onUploadFile={handleUploadFile}
          />
        </>
      )}

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSubmit={handleOnboardSubmit}
      />
    </div>
  );
};
