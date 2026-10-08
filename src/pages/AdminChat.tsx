import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type ChatSession, type ChatMessage } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, MessageCircle, User } from "lucide-react";

function timeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString();
}

export default function AdminChat() {
  const [selected, setSelected] = useState<ChatSession | null>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["/api/admin/chat-sessions"],
    queryFn: () => adminApi.chatSessions.list(),
  });

  const { data: messages = [], isLoading: msgLoading } = useQuery({
    queryKey: ["/api/admin/chat-sessions", selected?.id, "messages"],
    queryFn: () => adminApi.chatSessions.messages(selected!.id),
    enabled: !!selected,
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <h1 className="font-serif text-2xl font-bold text-primary">Chat Sessions</h1>

        <div className="flex gap-5 items-start">
          {/* Sessions List */}
          <Card className={`border border-border/60 flex-1 overflow-hidden ${selected ? "hidden sm:block" : ""}`}>
            {isLoading ? (
              <div className="p-10 text-center text-muted-foreground animate-pulse font-sans">Loading…</div>
            ) : sessions.length === 0 ? (
              <div className="p-16 text-center font-sans">
                <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No chat sessions yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Sessions will appear here once visitors start chatting.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    className={`w-full text-left px-4 py-3.5 hover:bg-muted/30 transition-colors ${selected?.id === s.id ? "bg-muted/40" : ""}`}
                    onClick={() => setSelected(s)}
                    data-testid={`row-session-${s.id}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate font-sans">
                            {s.visitor_name ?? "Anonymous"}
                          </p>
                          {s.visitor_email && (
                            <p className="text-xs text-muted-foreground truncate">{s.visitor_email}</p>
                          )}
                          {s.page_url && (
                            <p className="text-xs text-muted-foreground/60 truncate">{s.page_url}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground font-sans">
                          {s.started_at ? new Date(s.started_at).toLocaleDateString() : "—"}
                        </p>
                        {s.is_converted && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                            Converted
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Conversation Panel */}
          {selected && (
            <Card className="border border-border/60 w-full sm:w-96 shrink-0 flex flex-col" style={{ height: "600px" }}>
              <CardHeader className="pb-3 flex-row items-center justify-between shrink-0 border-b border-border/50">
                <div>
                  <CardTitle className="font-serif text-base text-primary">
                    {selected.visitor_name ?? "Anonymous"}
                  </CardTitle>
                  {selected.visitor_email && (
                    <p className="text-xs text-muted-foreground font-sans">{selected.visitor_email}</p>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>

              {/* Session Info */}
              <div className="px-4 py-2 bg-muted/30 border-b border-border/30 shrink-0 font-sans text-xs text-muted-foreground flex gap-4">
                <span>Started: {timeAgo(selected.started_at)}</span>
                {selected.is_converted && <span className="text-green-600 font-medium">✓ Converted</span>}
              </div>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgLoading ? (
                  <div className="text-center text-muted-foreground text-sm animate-pulse py-8 font-sans">
                    Loading messages…
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8 font-sans">
                    No messages in this session.
                  </div>
                ) : (
                  messages.map((msg: ChatMessage) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_agent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg text-sm font-sans leading-relaxed ${
                          msg.is_agent
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p>{msg.message}</p>
                        {msg.sent_at && (
                          <p className={`text-xs mt-1 ${msg.is_agent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {new Date(msg.sent_at).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
