import React, { useEffect, useState } from 'react';
import {
  Link2, RefreshCw, CheckCircle, XCircle, AlertCircle,
  CreditCard, Network, Fingerprint, Webhook, Loader2,
  ExternalLink, Settings, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

const TYPE_CONFIG = {
  payment_gateway: { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  tracking_network: { icon: Network, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  attendance_device: { icon: Fingerprint, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  webhook: { icon: Webhook, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};

const TYPE_LABELS = {
  payment_gateway: 'Cổng thanh toán',
  tracking_network: 'Tracking Network',
  attendance_device: 'Thiết bị chấm công',
  webhook: 'Webhook',
};

const STATUS_CONFIG = {
  active:   { cls: 'badge-success', label: 'Hoạt động', icon: CheckCircle },
  inactive: { cls: 'badge-neutral', label: 'Không hoạt động', icon: XCircle },
  error:    { cls: 'badge-danger', label: 'Lỗi', icon: AlertCircle },
};

export default function IntegrationPage() {
  const { api } = useAuth();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/integrations');
      setIntegrations(res.data.integrations || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSync = async (id, name) => {
    setSyncing(id);
    try {
      const res = await api.post(`/integrations/${id}/sync`);
      alert(res.data.message);
      await load();
    } catch (e) {
      alert(e.response?.data?.detail || 'Lỗi đồng bộ');
    } finally {
      setSyncing(null);
    }
  };

  const grouped = integrations.reduce((acc, int) => {
    (acc[int.type] = acc[int.type] || []).push(int);
    return acc;
  }, {});

  return (
    <Layout title="Integration Hub" subtitle="Quản lý kết nối API, Webhook và thiết bị tích hợp">
      {/* Endpoint info */}
      <div className="card p-5 mb-5 bg-gradient-to-r from-brand/10 to-blue-500/10 border-brand/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-brand/20 border border-brand/30">
            <Zap size={20} className="text-brand-light" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white mb-2">Postback / Webhook Endpoints</h3>
            <div className="space-y-2">
              {[
                { label: 'Postback Tracking (Universal)', url: 'POST /api/affiliates/postback', note: 'affiliate_code, click_id, revenue' },
                { label: 'Webhook nhận dữ liệu chung', url: 'POST /api/integrations/webhook', note: 'Header: X-Source: [network-name]' },
                { label: 'Đồng bộ máy chấm công', url: 'POST /api/attendance/sync-device', note: 'device_id, records[]' },
              ].map(({ label, url, note }) => (
                <div key={url} className="flex items-start gap-3 p-2.5 bg-surface-card/50 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-300">{label}</p>
                    <code className="text-xs text-brand-light font-mono">{url}</code>
                    <p className="text-xs text-slate-500 mt-0.5">Params: {note}</p>
                  </div>
                  <ExternalLink size={14} className="text-slate-500 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Integration Cards by type */}
      {Object.entries(grouped).map(([type, items]) => {
        const tc = TYPE_CONFIG[type] || TYPE_CONFIG.webhook;
        const TypeIcon = tc.icon;
        return (
          <div key={type} className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <TypeIcon size={16} className={tc.color} />
              <h3 className="font-semibold text-slate-300 text-sm">{TYPE_LABELS[type] || type}</h3>
              <div className="flex-1 h-px bg-surface-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((int) => {
                const sc = STATUS_CONFIG[int.status] || STATUS_CONFIG.inactive;
                const ScIcon = sc.icon;
                return (
                  <div key={int.id} className="card p-4 hover:border-brand/20 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${tc.bg}`}>
                          <TypeIcon size={18} className={tc.color} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{int.name}</p>
                          <p className="text-xs text-slate-500">{TYPE_LABELS[int.type]}</p>
                        </div>
                      </div>
                      <span className={`badge ${sc.cls} flex items-center gap-1`}>
                        <ScIcon size={10} />
                        {sc.label}
                      </span>
                    </div>

                    {/* Last sync */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-500">
                        Đồng bộ lần cuối:{' '}
                        <span className="text-slate-400">
                          {int.last_sync
                            ? new Date(int.last_sync).toLocaleString('vi-VN')
                            : 'Chưa đồng bộ'}
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSync(int.id, int.name)}
                        disabled={syncing === int.id || int.status === 'inactive'}
                        className="btn-primary btn-sm flex-1 justify-center"
                      >
                        {syncing === int.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <RefreshCw size={12} />}
                        Đồng bộ
                      </button>
                      <button className="btn-secondary btn-sm">
                        <Settings size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* API Docs link */}
      <div className="card p-4 border-brand/20 bg-gradient-to-r from-brand/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">API Documentation</p>
            <p className="text-xs text-slate-400">Xem tài liệu API đầy đủ tại Swagger UI</p>
          </div>
          <a
            href="http://localhost:8000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="btn-primary btn-sm"
          >
            <ExternalLink size={14} /> Mở Swagger
          </a>
        </div>
      </div>
    </Layout>
  );
}
