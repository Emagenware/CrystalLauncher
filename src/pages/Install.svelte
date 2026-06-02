<script lang="ts">
    import { onMount } from "svelte";
    import { installInstance } from "$lib/helpers/instances";
    import { setupInstallListeners } from "$lib/helpers/events";
    import {
        fetchVersionManifest,
        filterVersions,
    } from "$lib/helpers/versions";
    import type { VersionEntry } from "$lib/types";
    import { Select } from "$lib/components/ui/select/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Card } from "$lib/components/ui/card/index.js";
    import { CardContent } from "$lib/components/ui/card/index.js";
    import { CardHeader } from "$lib/components/ui/card/index.js";
    import { CardTitle } from "$lib/components/ui/card/index.js";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";

    let allVersions = $state<VersionEntry[]>([]);
    let filteredVersions = $derived.by(() =>
        filterVersions(allVersions, searchQuery, includeSnapshots),
    );
    let selectedVersion = $state("");
    let instanceName = $state("");
    let installStatus = $state("");
    let isLoading = $state(true);
    let isInstalling = $state(false);
    let includeSnapshots = $state(false);
    let searchQuery = $state("");

    onMount(async () => {
        await fetchVersions();

        setupInstallListeners(
            (statusMessage) => {
                installStatus = statusMessage;
                if (statusMessage === "Installation Complete!") {
                    isInstalling = false;
                }
            },
            (error) => {
                installStatus = `Error: ${error}`;
                isInstalling = false;
            },
        );
    });

    async function fetchVersions() {
        try {
            const manifest = await fetchVersionManifest();
            allVersions = manifest.versions;
            selectedVersion = manifest.latest.release;
            instanceName = `Minecraft ${manifest.latest.release}`;
            isLoading = false;
        } catch (error) {
            installStatus = `Failed to fetch versions: ${error}`;
            isLoading = false;
        }
    }

    async function handleInstall() {
        if (!instanceName.trim()) {
            installStatus = "Please enter an instance name";
            return;
        }
        if (!selectedVersion) {
            installStatus = "Please select a version";
            return;
        }

        isInstalling = true;
        installStatus = `Starting installation of ${instanceName} (${selectedVersion})...`;

        try {
            await installInstance(instanceName, selectedVersion);
        } catch (error) {
            installStatus = `Installation failed: ${error}`;
            isInstalling = false;
        }
    }
</script>

<div class="flex flex-1 flex-col overflow-hidden p-6">
    {#if isLoading}
        <Card>
            <CardContent class="p-4">
                <p>Loading versions...</p>
            </CardContent>
        </Card>
    {:else}
        <div class="flex h-full flex-col gap-4 overflow-hidden md:flex-row">
            <div class="flex flex-1 flex-col overflow-hidden">
                <Card class="flex h-full flex-col">
                    <CardHeader>
                        <CardTitle>Installations</CardTitle>
                    </CardHeader>
                    <CardContent class="flex-1 space-y-4 overflow-y-auto">
                        <div class="space-y-2">
                            <label
                                for="instance-name"
                                class="block text-sm font-medium"
                                >Instance Name</label
                            >
                            <input
                                id="instance-name"
                                type="text"
                                bind:value={instanceName}
                                placeholder="Enter instance name"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                disabled={isInstalling}
                            />
                        </div>

                        <div class="flex items-center gap-2">
                            <Checkbox
                                checked={includeSnapshots}
                                id="snapshots"
                                onchange={(e) => {
                                    const target =
                                        e.target as HTMLInputElement | null;
                                    includeSnapshots = target?.checked ?? false;
                                }}
                            />
                            <label for="snapshots" class="text-sm font-medium"
                                >Include Snapshots</label
                            >
                        </div>

                        <div class="space-y-2">
                            <label
                                for="search"
                                class="block text-sm font-medium"
                                >Search Versions</label
                            >
                            <input
                                id="search"
                                type="text"
                                bind:value={searchQuery}
                                placeholder="Search versions..."
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                disabled={isInstalling}
                            />
                        </div>

                        <div class="space-y-2">
                            <label
                                for="version-select"
                                class="block text-sm font-medium"
                                >Minecraft Version</label
                            >
                            <Select
                                bind:value={selectedVersion}
                                disabled={isInstalling}
                            >
                                {#each filteredVersions as version}
                                    <option value={version.id}
                                        >{version.id}</option
                                    >
                                {/each}
                            </Select>
                        </div>

                        <Button
                            onclick={handleInstall}
                            disabled={isInstalling ||
                                !instanceName.trim() ||
                                !selectedVersion}
                            class="w-full"
                        >
                            {isInstalling ? "Installing..." : "Install"}
                        </Button>

                        {#if installStatus}
                            <div class="rounded-md bg-muted p-3 text-sm">
                                {installStatus}
                            </div>
                        {/if}
                    </CardContent>
                </Card>
            </div>

            <div class="flex flex-1 flex-col overflow-hidden">
                <Card class="flex h-full flex-col">
                    <CardHeader>
                        <CardTitle>Available Versions</CardTitle>
                    </CardHeader>
                    <CardContent class="flex-1 overflow-y-auto">
                        <div class="max-h-96 space-y-2 overflow-y-auto">
                            {#each filteredVersions as version (version.id)}
                                <button
                                    onclick={() =>
                                        (selectedVersion = version.id)}
                                    disabled={isInstalling}
                                    class="flex w-full items-center justify-between rounded-md border border-border bg-transparent p-2 text-foreground transition-all duration-200 hover:not-disabled:bg-accent disabled:cursor-not-allowed disabled:opacity-50 {selectedVersion ===
                                    version.id
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : ''}"
                                >
                                    <div class="flex flex-col items-start">
                                        <span class="font-medium"
                                            >{version.id}</span
                                        >
                                        <span
                                            class="text-xs text-muted-foreground"
                                            >{version.type}</span
                                        >
                                    </div>
                                    {#if selectedVersion === version.id}
                                        <span class="text-sm text-primary"
                                            >✓</span
                                        >
                                    {/if}
                                </button>
                            {/each}

                            {#if filteredVersions.length === 0}
                                <p
                                    class="p-4 text-center text-sm text-muted-foreground"
                                >
                                    No versions found matching your search.
                                </p>
                            {/if}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    {/if}
</div>
