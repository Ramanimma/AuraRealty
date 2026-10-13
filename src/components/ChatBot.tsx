import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X, Send, Home } from "lucide-react";
import { parseMessage } from "@/lib/chatbot";
import type { Listing } from "@/lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  listings?: Listing[];
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  intent: "greeting",
  content:
    "Hi! I'm your Aura Realty assistant. I can help you find properties. Try asking: \"Show me 4 bed homes in Leander\" or \"Homes under $500k in Frisco\"",
};

const STORAGE_MESSAGES = "trh_chat_messages";
const STORAGE_OPEN = "trh_chat_open";
const STORAGE_SESSION = "trh_chat_session";

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES);
    if (raw) return JSON.parse(raw) as ChatMessage[];
  } catch (_) {}
  return [WELCOME];
}

function getSessionToken(): string {
  let token = localStorage.getItem(STORAGE_SESSION);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(STORAGE_SESSION, token);
  }
  return token;
}

function buildBotMessage(
  intent: string,
  listings: Listing[]
): Pick<ChatMessage, "content" | "intent" | "listings"> {
  switch (intent) {
    case "greeting":
      return {
        intent,
        content:
          "Hello! Welcome to Aura Realty. I can help you find properties in the DFW area. What are you looking for?",
      };
    case "help":
      return {
        intent,
        content:
          "Here's what I can do:\n• Find homes by beds, baths, city & price\n• Search Leander, Liberty Hill, Georgetown, Round Rock, Frisco, Hutto & Austin\n• Filter by property type (single family, condo, townhouse)\n\nTry: \"Show me 3 bed homes in Round Rock under $400k\"",
      };
    case "contact":
      return {
        intent,
        content:
          "I'd love to connect you with our agent! You can reach us or schedule a tour using the button below.",
      };
    case "valuation":
      return {
        intent,
        content:
          "Curious what your home is worth? Get a free home valuation from our local Austin-area experts.",
      };
    case "mortgage":
      return {
        intent,
        content:
          "Use our mortgage calculator to estimate your monthly payments and see what you can afford.",
      };
    case "property_search":
      if (listings.length > 0) {
        return {
          intent,
          content: `I found ${listings.length} propert${listings.length === 1 ? "y" : "ies"} matching your search:`,
          listings,
        };
      }
      return {
        intent: "property_search_empty",
        content:
          "I didn't find any properties matching that search in our current listings. Our inventory is growing — would you like to be notified when new listings match your criteria?",
      };
    default:
      return {
        intent: "fallback",
        content:
          "I can help you find properties! Try: \"Show me 3 bed homes in Austin\" or ask about scheduling a tour.",
      };
  }
}

export default function ChatBot() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_OPEN) === "true"; } catch (_) { return false; }
  });
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages)); } catch (_) {}
  }, [messages]);

  // Persist isOpen to localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_OPEN, String(isOpen)); } catch (_) {}
  }, [isOpen]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input and clear unread when opened
  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Auto-close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Hide on all admin routes
  if (location.pathname.startsWith("/admin")) return null;

  async function handleSend() {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const { intent, filters } = parseMessage(text);
    let listings: Listing[] = [];

    try {
      if (intent === "property_search") {
        const resp = await fetch("/api/chatbot/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filters,
            session_token: getSessionToken(),
            user_message: text,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          listings = data.listings ?? [];
        }
      }
    } catch (_) {}

    await new Promise((r) => setTimeout(r, 750));
    setIsTyping(false);

    const botData = buildBotMessage(intent, listings);
    const botMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", ...botData };
    setMessages((prev) => [...prev, botMsg]);

    if (!isOpen) setUnread((c) => c + 1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        data-testid="chatbot-toggle"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Open chat assistant"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl items-center justify-center transition-transform duration-200 hover:scale-110 focus:outline-none ${isOpen ? "hidden sm:flex" : "flex"}`}
        style={{ backgroundColor: "#1E2A44" }}
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full opacity-50 animate-ping" style={{ backgroundColor: "#C07A4A" }} />
        )}
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
        {!isOpen && unread > 0 && (
          <span
            className="absolute -top-1 -right-1 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#C07A4A" }}
          >
            {unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed z-40 flex flex-col shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right
          sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[500px] sm:rounded-2xl
          max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-16 max-sm:rounded-none
          ${isOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ backgroundColor: "#1E2A44", position: "sticky", top: 0, zIndex: 10, minHeight: "64px", padding: "0 16px" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#C07A4A" }}>
              <Home className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Aura Realty Assistant</p>
              <p className="text-xs" style={{ color: "#C07A4A" }}>Here to help you find your home</p>
            </div>
          </div>
          <button
            data-testid="chatbot-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
            className="sm:hidden"
            style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", cursor: "pointer", color: "#ffffff", fontSize: "20px", fontWeight: 300, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Message thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <div className="flex gap-2 items-end">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#1E2A44" }}>
                <Home className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:0ms]" style={{ backgroundColor: "#1E2A44" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:150ms]" style={{ backgroundColor: "#1E2A44" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:300ms]" style={{ backgroundColor: "#1E2A44" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="bg-white border-t border-gray-200 flex gap-2 shrink-0" style={{ padding: "12px 12px 16px" }}>
          <input
            ref={inputRef}
            data-testid="chatbot-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about properties..."
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-1 transition-colors"
            style={{ "--tw-ring-color": "#1E2A44" } as React.CSSProperties}
          />
          <button
            data-testid="chatbot-send"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-colors shrink-0"
            style={{ backgroundColor: "#1E2A44" }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "items-end"}`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#1E2A44" }}
        >
          <Home className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[82%] space-y-2 ${isUser ? "items-end flex flex-col" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
            isUser
              ? "text-white rounded-br-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
          }`}
          style={isUser ? { backgroundColor: "#C07A4A" } : undefined}
        >
          {message.content}
        </div>

        {!isUser && message.intent === "contact" && (
          <a href="/#contact" className="inline-block text-xs text-white px-3 py-1.5 rounded-full transition-opacity hover:opacity-90" style={{ backgroundColor: "#1E2A44" }}>
            Contact an Agent
          </a>
        )}
        {!isUser && message.intent === "valuation" && (
          <a href="/home-valuation" className="inline-block text-xs text-white px-3 py-1.5 rounded-full transition-opacity hover:opacity-90" style={{ backgroundColor: "#1E2A44" }}>
            Get Free Valuation →
          </a>
        )}
        {!isUser && message.intent === "mortgage" && (
          <a href="/mortgage-calculator" className="inline-block text-xs text-white px-3 py-1.5 rounded-full transition-opacity hover:opacity-90" style={{ backgroundColor: "#1E2A44" }}>
            Open Calculator →
          </a>
        )}
        {!isUser && message.intent === "property_search_empty" && (
          <a href="/#contact" className="inline-block text-xs text-white px-3 py-1.5 rounded-full transition-opacity hover:opacity-90" style={{ backgroundColor: "#1E2A44" }}>
            Contact an Agent
          </a>
        )}

        {!isUser && message.listings && message.listings.length > 0 && (
          <div className="space-y-2 w-full">
            {message.listings.slice(0, 3).map((l) => (
              <PropertyCard key={l.id} listing={l} />
            ))}
            {message.listings.length > 3 && (
              <p className="text-xs text-gray-500 pl-1">
                +{message.listings.length - 3} more.{" "}
                <a href="/" className="underline" style={{ color: "#1E2A44" }}>View all listings</a>
              </p>
            )}
            <a href="/#contact" className="inline-block text-xs text-white px-3 py-1.5 rounded-full transition-opacity hover:opacity-90" style={{ backgroundColor: "#C07A4A" }}>
              Want to schedule a tour? Click here
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyCard({ listing }: { listing: Listing }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {listing.main_image && (
        <img
          src={listing.main_image}
          alt={listing.title}
          className="w-full h-24 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <div className="p-3">
        <p className="font-semibold text-sm leading-tight truncate" style={{ color: "#1E2A44" }}>{listing.address}</p>
        <p className="font-bold text-sm mt-0.5" style={{ color: "#C07A4A" }}>{listing.price}</p>
        <div className="flex gap-3 text-xs text-gray-500 mt-1">
          <span>{listing.beds} bd</span>
          <span>{listing.baths} ba</span>
          {listing.sqft > 0 && <span>{listing.sqft.toLocaleString()} sqft</span>}
        </div>
        <a
          href={`/property/${listing.id}`}
          data-testid={`chatbot-view-property-${listing.id}`}
          className="mt-2 block text-center text-xs text-white px-3 py-1.5 rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: "#1E2A44" }}
        >
          View Details
        </a>
      </div>
    </div>
  );
}
