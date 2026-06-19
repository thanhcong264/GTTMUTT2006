import React, { useEffect, useState } from 'react';
import {
  GitBranch, CheckCircle, XCircle, Clock, AlertCircle,
  ChevronRight, Loader2, MessageSquare, X, Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

const STATUS_CONFIG = {
  pending:     { label: 'Chờ duyệt', cls: 'badge-warning', icon: Clock },
  in_progress: { label: 'Đang xử lý', cls: 'badge-info', icon: GitBranch },
  approved:    { label: 'Đã duyệt', cls: 'badge-success', icon: CheckCircle },
  rejected:    { label: 'Từ chối', cls: 'badge-danger', icon: XCircle },
  cancelled:   { label: 'Đã hủy', cls: 'badge-neutral', icon: XCircle },
};

const STEP_STATUS_CONFIG = {
  pending:      { cls: 'bg-amber-500/20 border-amber-500/50 text-amber-400', dot: 'bg-amber-500' },
  approved:     { cls: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400', dot: 'bg-emerald-500' },
  waiting:      { cls: 'bg-slate-700/50 border-slate-600/50 text-slate-500', dot: 'bg-slate-600' },
  rejected:     { cls: 'bg-red-500/20 border-red-500/50 text-red-400', dot: 'bg-red-500' },
  waiting_info: { cls: 'bg-blue-500/20 border-blue-500/50 text-blue-400', dot: 'bg-blue-500' },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Thấp', cls: 'badge-neutral' },
  normal: { label: 'Bình thường', cls: 'badge-info' },
  high:   { label: 'Cao', cls: 'badge-warning' },
  urgent: { label: 'Khẩn cấp', cls: 'badge-danger' },
};

const TYPE_LABELS = {
  leave_request:    '🏖️ Nghỉ phép',
  payout_approval:  '💰 Duyệt hoa hồng',
  shift_change:     '🔄 Đổi ca',
  overtime:         '⏰ Tăng ca',
};

function ActionModal({ workflow, onClose, onSuccess }) {
  const { api } = useAuth();
  const [action, setAction] = useState('approve');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      await api.post(`/workflow/${workflow.id}/action`, { action, note });
      onSuccess?.();
      onClose();
    } catch (e) {
      alert(e.response?.data?.detail || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md mx-4 p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg">Xử lý yêu cầu</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-3 bg-surface-elevated rounded-xl mb-4 text-sm">
          <p className="text-white font-medium">{workflow.title}</p>
          <p className="text-slate-500 text-xs mt-1">Bước {workflow.current_step}/{workflow.total_steps}</p>
        </div>

        <div className="mb-4">
          <label className="label">Hành động</label>
          <div className="flex gap-2">
            {[
              { val: 'approve', label: '✓ Phê duyệt', cls: workflow.current_step >= workflow.total_steps ? 'btn-success' : 'btn-primary' },
              { val: 'reject', label: '✗ Từ chối', cls: 'btn-danger' },
              { val: 'request_info', label: '? Yêu cầu thêm', cls: 'btn-secondary' },
            ].map(({ val, label, cls }) => (
              <button
                key={val}
                onClick={() => setAction(val)}
                className={`btn btn-sm flex-1 justify-center ${action === val ? cls : 'btn-secondary opacity-60'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="label">Ghi chú {action !== 'approve' && '(bắt buộc)'}</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            className="input min-h-[80px] resize-none" placeholder="Thêm ghi chú..." />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Huỷ</button>
          <button onClick={handleAction} disabled={loading || (action !== 'approve' && !note)}
            className={`flex-1 justify-center ${action === 'approve' ? 'btn-success' : action === 'reject' ? 'btn-danger' : 'btn-primary'} btn`}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkflowCard({ wf, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_CONFIG[wf.status] || STATUS_CONFIG.pending;
  const pr = PRIORITY_CONFIG[wf.priority] || PRIORITY_CONFIG.normal;
  const StIcon = st.icon;

  return (
    <div className="card overflow-hidden transition-all hover:border-brand/20">
      <div
        className="p-4 cursor-pointer flex items-start gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`mt-1 p-2 rounded-xl border ${
          wf.status === 'pending' ? 'bg-amber-900/30 border-amber-700/30' :
          wf.status === 'approved' ? 'bg-emerald-900/30 border-emerald-700/30' :
          wf.status === 'in_progress' ? 'bg-blue-900/30 border-blue-700/30' :
          'bg-red-900/30 border-red-700/30'
        }`}>
          <StIcon size={16} className={
            wf.status === 'pending' ? 'text-amber-400' :
            wf.status === 'approved' ? 'text-emerald-400' :
            wf.status === 'in_progress' ? 'text-blue-400' : 'text-red-400'
          } />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-white text-sm">{wf.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {TYPE_LABELS[wf.type] || wf.type} • {wf.requester_name} •{' '}
                {new Date(wf.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className={`badge ${pr.cls}`}>{pr.label}</span>
              <span className={`badge ${st.cls}`}>{st.label}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 bg-surface-elevated rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand to-blue-500 transition-all duration-500"
                style={{ width: `${(wf.current_step / wf.total_steps) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 flex-shrink-0">
              {wf.current_step}/{wf.total_steps}
            </span>
          </div>
        </div>

        <ChevronRight size={16} className={`text-slate-500 transition-transform flex-shrink-0 mt-1 ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {/* Expanded: Steps Timeline */}
      {expanded && (
        <div className="border-t border-surface-border px-4 pb-4 pt-3 animate-slide-up">
          <div className="space-y-3 mb-4">
            {wf.steps.map((step, i) => {
              const sc = STEP_STATUS_CONFIG[step.status] || STEP_STATUS_CONFIG.waiting;
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${sc.cls}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${sc.dot} text-white mt-0.5`}>
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{step.name}</p>
                    <p className="text-xs text-slate-500 capitalize">Role: {step.role?.replace('_', ' ')}</p>
                    {step.acted_at && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(step.acted_at).toLocaleString('vi-VN')}
                      </p>
                    )}
                    {step.note && <p className="text-xs text-slate-400 mt-1 italic">"{step.note}"</p>}
                  </div>
                  <span className="text-xs capitalize font-medium">
                    {step.status === 'approved' ? '✓ Đã duyệt' :
                     step.status === 'rejected' ? '✗ Từ chối' :
                     step.status === 'pending' ? '⏳ Chờ duyệt' : '○ Đang chờ'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action button for pending steps */}
          {(wf.status === 'pending' || wf.status === 'in_progress') && (
            <button
              onClick={() => onAction(wf)}
              className="btn-primary w-full justify-center"
            >
              <MessageSquare size={16} />
              Xử lý yêu cầu này
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkflowPage() {
  const { api } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [actionWf, setActionWf] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workflow');
      setWorkflows(res.data.workflows || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = tab === 'all' ? workflows :
    tab === 'pending' ? workflows.filter(w => ['pending','in_progress'].includes(w.status)) :
    tab === 'hr' ? workflows.filter(w => w.type === 'leave_request') :
    workflows.filter(w => w.type === 'payout_approval');

  const pendingCount = workflows.filter(w => w.status === 'pending').length;

  return (
    <Layout title="Workflow Phê Duyệt" subtitle="Quản lý luồng phê duyệt nhân sự và hoa hồng affiliate">
      {actionWf && <ActionModal workflow={actionWf} onClose={() => setActionWf(null)} onSuccess={load} />}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Tổng yêu cầu', val: workflows.length, color: 'text-white' },
          { label: 'Chờ duyệt', val: workflows.filter(w=>w.status==='pending').length, color: 'text-amber-400' },
          { label: 'Đang xử lý', val: workflows.filter(w=>w.status==='in_progress').length, color: 'text-blue-400' },
          { label: 'Đã hoàn tất', val: workflows.filter(w=>['approved','rejected'].includes(w.status)).length, color: 'text-emerald-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card p-3.5 text-center">
            <p className={`text-2xl font-black ${color}`}>{val}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-card rounded-xl border border-surface-border mb-5 w-fit">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'pending', label: `Chờ duyệt${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { id: 'hr', label: '🏖️ Nhân sự' },
          { id: 'affiliate', label: '💰 Affiliate' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-brand text-white shadow-glow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Workflow Cards */}
      {loading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle size={48} className="text-emerald-500/40 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Không có yêu cầu nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((wf) => (
            <WorkflowCard key={wf.id} wf={wf} onAction={setActionWf} />
          ))}
        </div>
      )}
    </Layout>
  );
}
