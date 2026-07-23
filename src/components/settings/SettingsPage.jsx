import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle2, Loader2, Save, ShieldCheck } from "lucide-react";
import {
  setConfig,
  setConfigLoading,
  setConfigError,
} from "../../store/settingsSlice";
import { settingsService } from "../../services/settingsService";
import { normalizeRatingRules } from "../../utils/ratingConfig";

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { config, loading } = useSelector((state) => state.settings);
  const user = useSelector((state) => state.auth.user);
  const [draftRules, setDraftRules] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      dispatch(setConfigLoading(true));
      try {
        const data = await settingsService.getAppSettings();
        dispatch(setConfig(data));
      } catch (error) {
        dispatch(setConfigError(error.message));
      }
    };

    load();
  }, [dispatch]);

  useEffect(() => {
    setDraftRules(normalizeRatingRules(config));
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const nextConfig = { ...config, ratingRules: draftRules };
      await settingsService.updateAppSettings(nextConfig);
      dispatch(setConfig(nextConfig));
    } catch (error) {
      dispatch(setConfigError(error.message));
    } finally {
      setSaving(false);
    }
  };

  const updateLabel = (index, value) => {
    setDraftRules((prev) =>
      prev.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, label: value } : rule,
      ),
    );
  };

  const toggleActive = (index) => {
    setDraftRules((prev) =>
      prev.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, isActive: !rule.isActive } : rule,
      ),
    );
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-500">
            Admin Controls
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">
            Performance Settings
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Customize how ratings are labeled and grouped across the tracker.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
          <ShieldCheck size={15} />
          {isAdmin ? "Admin access" : "Trainer view"}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Rating scale
            </h2>
            <p className="text-sm text-gray-500">
              You can rename the labels and enable or disable levels for the
              team.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !isAdmin}
            className="btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={15} />
            )}{" "}
            Save Changes
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="animate-spin" size={15} /> Loading settings…
          </div>
        ) : (
          <div className="space-y-3">
            {draftRules.map((rule, index) => (
              <div
                key={rule.key || `${rule.label}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <button
                  onClick={() => toggleActive(index)}
                  className={`h-6 w-6 rounded-full border ${rule.isActive ? "border-emerald-500 bg-emerald-500" : "border-gray-300 bg-white"}`}
                >
                  {rule.isActive ? (
                    <CheckCircle2 size={14} className="mx-auto text-white" />
                  ) : null}
                </button>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                    Level {rule.value}
                  </p>
                  <input
                    value={rule.label}
                    onChange={(event) => updateLabel(index, event.target.value)}
                    disabled={!isAdmin}
                    className="input-field mt-2"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
