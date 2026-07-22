import { useEffect, useMemo, useState } from "react";
import "./index.css";
import Console from "./lib/components/Console";
import TitleBar from "./lib/components/TitleBar";
import {
  logout,
  scheduleTokenRefresh,
  setupAuthListeners,
  startLogin,
  tryAutoLogin,
} from "./lib/helpers/auth";
import { setupGameListeners, setupInstallListeners } from "./lib/helpers/events";
import {
  getInstallInstanceName,
  installInstance,
  launchInstance,
  listInstances,
} from "./lib/helpers/instances";
import { fetchVersionManifest, filterVersions } from "./lib/helpers/versions";
import type { Account, VersionEntry } from "./lib/types";

function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [instances, setInstances] = useState<string[]>([]);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [versionQuery, setVersionQuery] = useState("");
  const [includeSnapshots, setIncludeSnapshots] = useState(false);

  const [installStatus, setInstallStatus] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [runningInstance, setRunningInstance] = useState<string | null>(null);

  // Restore session + subscribe to login events
  useEffect(() => {
    let isMounted = true;

    const cleanupAuth = setupAuthListeners(
      (nextAccount) => {
        if (!isMounted) return;
        setAccount(nextAccount);
        setAuthError(null);
        setIsLoggingIn(false);
        setIsCheckingSession(false);
      },
      (message) => {
        if (!isMounted) return;
        setAuthError(message);
        setIsLoggingIn(false);
        setIsCheckingSession(false);
      },
    );

    void (async () => {
      try {
        const restored = await tryAutoLogin();
        if (!isMounted) return;
        setAccount(restored);
      } catch (err) {
        if (!isMounted) return;
        setAuthError(err instanceof Error ? err.message : "Failed to restore your session.");
      } finally {
        if (isMounted) setIsCheckingSession(false);
      }
    })();

    return () => {
      isMounted = false;
      void cleanupAuth();
    };
  }, []);

  useEffect(() => {
    if (!account) return;
    const cancelRefresh = scheduleTokenRefresh(account, (refreshed) => {
      setAccount(refreshed);
    });
    return cancelRefresh;
  }, [account]);

  // Subscribe to install progress events
  useEffect(() => {
    let isMounted = true;

    const cleanupInstallPromise = setupInstallListeners(
      (status) => {
        if (!isMounted) return;
        setInstallStatus(status);
        if (status.toLowerCase().includes("complete")) {
          setIsInstalling(false);
          void refreshInstances();
        }
      },
      (error) => {
        if (!isMounted) return;
        setInstallError(error);
        setIsInstalling(false);
      },
    );

    return () => {
      isMounted = false;
      void cleanupInstallPromise.then((cleanup) => cleanup());
    };
  }, []);

  // Load instances + version manifest once signed in
  useEffect(() => {
    if (!account) return;
    void refreshInstances();
    void loadVersions();
  }, [account]);

  useEffect(() => {
    let isMounted = true;

    const cleanupPromise = setupGameListeners(
      (event) => {
        if (!isMounted) return;
        setRunningInstance(event.instance_name);
      },
      () => {
        if (!isMounted) return;
        setRunningInstance(null);
      },
    );

    return () => {
      isMounted = false;
      void cleanupPromise.then((cleanup) => cleanup());
    };
  }, []);

  async function refreshInstances() {
    const list = await listInstances();
    setInstances(list);
  }

  async function loadVersions() {
    try {
      const manifest = await fetchVersionManifest();
      setVersions(manifest.versions);
      if (!selectedVersion) {
        setSelectedVersion(manifest.latest.release);
      }
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : "Failed to load version list.");
    }
  }

  const visibleVersions = useMemo(
    () => filterVersions(versions, versionQuery, includeSnapshots),
    [versions, versionQuery, includeSnapshots],
  );

  async function handleLogin() {
    try {
      setAuthError(null);
      setIsLoggingIn(true);
      await startLogin();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Failed to open Microsoft login.");
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    logout();
    setAccount(null);
    setInstances([]);
    setAuthError(null);
  }

  async function handleInstall() {
    if (!selectedVersion) return;
    const instanceName = getInstallInstanceName(selectedVersion);

    try {
      setIsInstalling(true);
      setInstallError(null);
      setInstallStatus("Starting install...");
      await installInstance(instanceName, selectedVersion);
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : "Failed to start installation.");
      setIsInstalling(false);
    }
  }

  async function handleLaunch(instanceName: string) {
    if (!account) return;
    if (runningInstance) {
      setLaunchError(`${runningInstance} is already running`);
      return;
    }
    try {
      setLaunchError(null);
      setRunningInstance(instanceName);
      await launchInstance(instanceName, account);
    } catch (err) {
      setRunningInstance(null);
      setLaunchError(err instanceof Error ? err.message : "Failed to launch instance.");
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TitleBar />
      <main className="flex-1 overflow-y-auto p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <span>
            session: {isCheckingSession ? "checking..." : account ? "active" : "none"}
          </span>
          <span>account: {account ? `${account.name} (${account.uuid})` : "-"}</span>
          <span>instances: {instances.length}</span>
          <span>versions loaded: {versions.length}</span>
        </div>

        {!account ? (
          <section className="rounded border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Login</h2>
            {authError ? (
              <p className="mt-2 text-xs text-red-400">{authError}</p>
            ) : null}
            <button
              type="button"
              onClick={handleLogin}
              disabled={isCheckingSession || isLoggingIn}
              className="mt-3 rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
            >
              {isLoggingIn ? "opening microsoft login..." : "login with microsoft"}
            </button>
          </section>
        ) : (
          <>
            <section className="rounded border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Account</h2>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded border border-border px-2 py-1 text-xs"
                >
                  logout
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                signed in as {account.name}, token expires{" "}
                {new Date(account.expires_at * 1000).toLocaleString()}
              </p>
            </section>

            <section className="rounded border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Install version</h2>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={versionQuery}
                  onChange={(e) => setVersionQuery(e.target.value)}
                  placeholder="filter versions..."
                  className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                />
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={includeSnapshots}
                    onChange={(e) => setIncludeSnapshots(e.target.checked)}
                  />
                  snapshots
                </label>
              </div>

              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-sm"
                size={6}
              >
                {visibleVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.id} {version.type !== "release" ? `(${version.type})` : ""}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleInstall}
                disabled={!selectedVersion || isInstalling}
                className="mt-2 rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                {isInstalling ? "installing..." : `install ${selectedVersion || ""}`}
              </button>

              {installStatus ? (
                <p className="mt-2 text-xs text-muted-foreground">status: {installStatus}</p>
              ) : null}
              {installError ? (
                <p className="mt-2 text-xs text-red-400">error: {installError}</p>
              ) : null}
            </section>

            <section className="rounded border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Instances</h2>
                <button
                  type="button"
                  onClick={() => void refreshInstances()}
                  className="text-xs text-muted-foreground"
                >
                  refresh
                </button>
              </div>

              {launchError ? (
                <p className="mt-2 text-xs text-red-400">error: {launchError}</p>
              ) : null}

              <ul className="mt-2 flex flex-col gap-1">
                {instances.length === 0 ? (
                  <li className="text-xs text-muted-foreground">no instances found</li>
                ) : (
                  instances.map((instanceName) => (
                    <li
                      key={instanceName}
                      className="flex items-center justify-between rounded border border-border px-2 py-1"
                    >
                      <span className="text-xs">{instanceName}</span>
                      <button
                        type="button"
                        onClick={() => void handleLaunch(instanceName)}
                        disabled={runningInstance !== null}
                        className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground disabled:opacity-50"
                      >
                        {runningInstance === instanceName ? "running" : "launch"}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </>
        )}
      </div>
      </main>
      <Console/>
    </div>
  );
}

export default App;
