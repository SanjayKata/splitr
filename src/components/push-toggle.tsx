"use client";

import { usePush } from "@/hooks/use-push";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Settings row to enable/disable OS push notifications. */
export function PushToggle() {
  const { supported, enabled, busy, error, enable, disable } = usePush();

  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Push notifications
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {!supported
            ? "Not available here. On iPhone, add Splitr to your Home Screen first."
            : enabled
              ? "On — you'll be alerted even when the app is closed."
              : "Get alerted when someone adds an expense or settles up."}
        </p>
        {error && (
          <p
            role="alert"
            className="mt-1 text-xs text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant={enabled ? "secondary" : "primary"}
        disabled={!supported}
        loading={busy}
        onClick={enabled ? disable : enable}
      >
        {enabled ? "Turn off" : "Turn on"}
      </Button>
    </Card>
  );
}
