import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

declare global {
  interface Window {
    api?: {
      getNames: () => Promise<{ id: number; name: string }[]>;
      addName: (name: string) => Promise<{ id: number; name: string }>;
      deleteName: (id: number) => Promise<{ success: boolean }>;
    };
  }
}

const Home = () => {
  const [names, setNames] = useState<{ id: number; name: string }[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    window.api?.getNames().then(setNames);
  }, []);

  const addName = async () => {
    if (!input.trim()) return;
    const newName = await window.api?.addName(input.trim());
    if (newName) setNames((prev) => [newName, ...prev]);
    setInput("");
  };

  const deleteName = async (id: number) => {
    await window.api?.deleteName(id);
    setNames((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Names DB Test</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addName()}
              placeholder="Enter a name..."
            />
            <Button onClick={addName}>Add</Button>
          </div>

          {/* List */}
          <div className="flex flex-col gap-2">
            {names.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No names yet. Add one!
              </p>
            ) : (
              names.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between border rounded-lg px-4 py-2"
                >
                  <span className="text-sm">{n.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteName(n.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
