import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle2, Loader2, Save, ShieldCheck } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase/firebase-config";
import {
  setConfig,
  setConfigLoading,
  setConfigError,
} from "../../store/settingsSlice";
import { settingsService } from "../../services/settingsService";
import { batchService } from "../../services/batchService";
import { normalizeRatingRules } from "../../utils/ratingConfig";

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { config, loading } = useSelector((state) => state.settings);
  const user = useSelector((state) => state.auth.user);
  const [draftRules, setDraftRules] = useState([]);
  const [saving, setSaving] = useState(false);
  const [managers, setManagers] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [accessRecords, setAccessRecords] = useState([]);
  const [accessLoading, setAccessLoading] = useState(false);

  const isAdmin = user?.role === "admin";

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

  useEffect(() => {
    if (!isAdmin) return;

    const loadAccessMatrix = async () => {
      setAccessLoading(true);
      try {
        const [managerSnapshot, batchList, accessList] = await Promise.all([
          getDocs(
            query(collection(db, "users"), where("role", "==", "manager")),
          ),
          batchService.getAllBatches(),
          batchService.getAllBatchAccess(),
        ]);

        setManagers(
          managerSnapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })),
        );
        setAllBatches(batchList);
        setAccessRecords(accessList);
      } catch (error) {
        console.error("Unable to load access matrix", error);
      } finally {
        setAccessLoading(false);
      }
    };

    loadAccessMatrix();
  }, [isAdmin]);

  const assignedBatchIdsByManager = useMemo(() => {
    return Object.fromEntries(
      managers.map((manager) => {
        const ids = accessRecords
          .filter(
            (item) => item.managerUid === manager.id && item.isActive !== false,
          )
          .map((item) => item.batchId);
        return [manager.id, new Set(ids)];
      }),
    );
  }, [managers, accessRecords]);

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

  const toggleAccess = async (managerUid, batchId) => {
    if (!isAdmin) return;

    const hasAccess = assignedBatchIdsByManager[managerUid]?.has(batchId);
    try {
      if (hasAccess) {
        await batchService.removeBatchAccess(managerUid, batchId);
      } else {
        await batchService.addBatchAccess(managerUid, batchId, user.uid);
      }

      const nextAccess = await batchService.getAllBatchAccess();
      setAccessRecords(nextAccess);
    } catch (error) {
      console.error("Unable to update manager access", error);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-500">
            Admin Controls
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">
            Performance Settings
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Customize ratings and assign which managers can access each batch.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
          <ShieldCheck size={15} />
          {isAdmin ? "Admin access" : "Trainer view"}
        </div>
      </div>

      <div className="card p-6 mb-8">
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

      <div className="card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Manager batch access
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Turn batch access on or off for each manager. This is the access
            model used for attendance visibility.
          </p>
        </div>

        {!isAdmin ? (
          <p className="text-sm text-gray-500">
            Only admins can manage manager access.
          </p>
        ) : accessLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="animate-spin" size={15} /> Loading access
            matrix…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] uppercase tracking-[0.22em] text-gray-400">
                  <th className="py-3 pr-4">Manager</th>
                  {allBatches.map((batch) => (
                    <th key={batch.id} className="py-3 pr-4 min-w-[120px]">
                      {batch.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {managers.length === 0 ? (
                  <tr>
                    <td
                      className="py-4 text-sm text-gray-500"
                      colSpan={allBatches.length + 1}
                    >
                      No manager users found in the database yet.
                    </td>
                  </tr>
                ) : (
                  managers.map((manager) => (
                    <tr key={manager.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium text-gray-800">
                        {manager.name || manager.email || manager.id}
                      </td>
                      {allBatches.map((batch) => {
                        const hasAccess = assignedBatchIdsByManager[
                          manager.id
                        ]?.has(batch.id);
                        return (
                          <td
                            key={`${manager.id}-${batch.id}`}
                            className="py-3 pr-4"
                          >
                            <button
                              onClick={() => toggleAccess(manager.id, batch.id)}
                              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                hasAccess
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {hasAccess ? "Granted" : "Not granted"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
