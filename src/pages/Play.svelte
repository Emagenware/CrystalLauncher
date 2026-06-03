<script lang="ts">
    import { onMount } from "svelte";
    import { listInstances, launchInstance } from "$lib/helpers/instances";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Card } from "$lib/components/ui/card/index.js";
    import { CardContent } from "$lib/components/ui/card/index.js";
    import { CardHeader } from "$lib/components/ui/card/index.js";
    import { CardTitle } from "$lib/components/ui/card/index.js";
    import type { Account } from "$lib/types";

    let { account }: { account: Account } = $props();

    const assets = import.meta.glob("/src/assets/*.png", {
        eager: true,
        query: "?url",
        import: "default",
    });
    let currentImageIndex = $state(0);
    let backgroundImages = $state<string[]>([]);
    let instances = $state<string[]>([]);
    let selectedInstance = $state("");
    let launching = $state(false);

    onMount(async () => {
        const assetUrls = Object.values(assets);
        backgroundImages = assetUrls.filter(
            (url): url is string => typeof url === "string",
        );
        randomizeImage();
        instances = await listInstances();
        if (instances.length > 0) {
            selectedInstance = instances[0];
        }
    });

    function randomizeImage() {
        if (backgroundImages.length > 0) {
            currentImageIndex = Math.floor(
                Math.random() * backgroundImages.length,
            );
        }
    }

    async function handleLaunch() {
        // DEBUG: this must fire on every click, no matter what.
        alert(
            "PLAY clicked. instance=" +
                JSON.stringify(selectedInstance) +
                " account=" +
                (account ? account.name : "NULL"),
        );
        console.log("handleLaunch fired", { selectedInstance, account });
        if (!selectedInstance) {
            alert("No instance selected.");
            return;
        }
        if (!account) {
            alert("Not logged in.");
            return;
        }
        launching = true;
        try {
            await launchInstance(selectedInstance, account);
        } catch (error) {
            alert(`Launch failed: ${error}`);
        } finally {
            launching = false;
        }
    }
</script>

<div class="flex flex-col flex-1 p-6 gap-6">
    <button
        onclick={randomizeImage}
        class="w-full h-80 rounded-xl overflow-hidden relative hover:scale-[1.01] transition-transform cursor-pointer"
    >
        {#if backgroundImages[currentImageIndex]}
            <img
                src={backgroundImages[currentImageIndex]}
                alt="Minecraft screenshot"
                class="w-full h-full object-cover"
            />
        {:else}
            <div
                class="w-full h-full bg-gradient-to-br from-green-200 to-slate-400"
            ></div>
        {/if}
    </button>

    {#if instances.length > 0}
        <Card class="max-w-md mx-auto w-full">
            <CardHeader>
                <CardTitle>Select Instance</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
                <div class="space-y-2">
                    <label for="instance-select" class="text-sm font-medium"
                        >Instance</label
                    >
                    <select
                        id="instance-select"
                        bind:value={selectedInstance}
                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        {#each instances as instance}
                            <option value={instance}>{instance}</option>
                        {/each}
                    </select>
                </div>
                <Button
                    onclick={handleLaunch}
                    class="w-full"
                    size="lg"
                    disabled={!selectedInstance || launching}
                >
                    {launching ? "LAUNCHING…" : "PLAY"}
                </Button>
            </CardContent>
        </Card>
    {:else}
        <Card class="max-w-md mx-auto w-full">
            <CardContent class="p-8 text-center">
                <p class="text-muted-foreground">
                    No instances found. Go to the Install page to create one!
                </p>
            </CardContent>
        </Card>
    {/if}
</div>
