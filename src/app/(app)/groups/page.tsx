"use client";

import Link from "next/link";
import { useGroups } from "@/hooks/use-groups";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function GroupsPage() {
  const { data: groups, error, isPending } = useGroups();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Your groups
        </h1>
        <Link href="/groups/new">
          <Button size="sm">New group</Button>
        </Link>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : "Failed to load groups"}
        </p>
      )}

      {isPending ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-emerald-600" />
        </div>
      ) : groups && groups.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-3">
          {groups?.map((g) => (
            <li key={g.id}>
              <Link href={`/group?id=${g.id}`} className="block">
                <Card className="transition-colors hover:border-emerald-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {g.name}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {g.memberCount}{" "}
                        {g.memberCount === 1 ? "member" : "members"} ·{" "}
                        {g.currency}
                      </p>
                    </div>
                    <span className="text-zinc-300 dark:text-zinc-600">›</span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
      <p className="text-zinc-700 dark:text-zinc-300">No groups yet</p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Create a group to start splitting expenses with friends.
      </p>
      <Link href="/groups/new" className="mt-4 inline-block">
        <Button>Create your first group</Button>
      </Link>
    </div>
  );
}
