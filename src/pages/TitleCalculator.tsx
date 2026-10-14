import { useState, useMemo } from "react";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MailingList from "@/components/MailingList";

const CHARCOAL = "#1E2A44";
const GOLD = "#C07A4A";
const CREAM = "#F7F8FA";

function calcTDIPremium(value: number): number {
  if (value <= 0) return 0;
  if (value <= 10000) return 119;
  if (value <= 25000) return 119 + ((value - 10000) / 1000) * 3.3;
  if (value <= 50000) return 168.5 + ((value - 25000) / 1000) * 2.9;
  if (value <= 100000) return 241 + ((value - 50000) / 1000) * 2.4;
  if (value <= 1000000) return 361 + ((value - 100000) / 1000) * 2.0;
  if (value <= 5000000) return 2161 + ((value - 1000000) / 1000) * 1.75;
  if (value <= 15000000) return 9161 + ((value - 5000000) / 1000) * 1.5;
  return 24161 + ((value - 15000000) / 1000) * 1.25;
}

function calcSimultaneousLoanPolicy(loanAmount: number): number {
  if (loanAmount <= 0) return 0;
  if (loanAmount <= 100000) return 100;
  return 100 + ((loanAmount - 100000) / 1000) * 1.0;
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

const ENDORSEMENTS = [
  { id: "t19", label: "T-19 Restrictions, Encroachments, Minerals", fee: 50 },
  { id: "t191", label: "T-19.1 Mineral Endorsement", fee: 50 },
  { id: "t36", label: "T-36 Energy Project Endorsement", fee: 100 },
  { id: "t17", label: "T-17 Access Endorsement", fee: 50 },
  { id: "t23", label: "T-23 Fairway Endorsement", fee: 50 },
  { id: "t30", label: "T-30 Manufactured Housing", fee: 100 },
];

const TitleCalculator = () => {
  const [txType, setTxType] = useState<"purchase" | "refinance">("purchase");
  const [propertyValue, setPropertyValue] = useState(350000);
  const [loanAmount, setLoanAmount] = useState(280000);
  const [ownerPolicy, setOwnerPolicy] = useState(true);
  const [loanPolicy, setLoanPolicy] = useState(true);
  const [endorsements, setEndorsements] = useState<Record<string, boolean>>({});

  const toggleEndorsement = (id: string) =>
    setEndorsements(prev => ({ ...prev, [id]: !prev[id] }));

  const calc = useMemo(() => {
    const showOwner = txType === "purchase" && ownerPolicy;
    const showLoan = loanPolicy;

    const ownerPremium = showOwner ? calcTDIPremium(propertyValue) : 0;

    let loanPremium = 0;
    if (showLoan) {
      if (showOwner) {
        loanPremium = calcSimultaneousLoanPolicy(loanAmount);
      } else {
        loanPremium = calcTDIPremium(loanAmount);
      }
    }

    const endorsementTotal = ENDORSEMENTS.reduce(
      (sum, e) => sum + (endorsements[e.id] ? e.fee : 0),
      0
    );

    const titlePremium = ownerPremium + loanPremium;
    const titleSearch = 200;
    const escrow = 350;
    const recording = 150;
    const additionalTotal = titleSearch + escrow + recording;
    const estimatedTotal = titlePremium + endorsementTotal + additionalTotal;

    const simultaneous = showOwner && showLoan;

    return {
      showOwner,
      showLoan,
      ownerPremium,
      loanPremium,
      simultaneous,
      endorsementTotal,
      titlePremium,
      titleSearch,
      escrow,
      recording,
      additionalTotal,
      estimatedTotal,
    };
  }, [txType, propertyValue, loanAmount, ownerPolicy, loanPolicy, endorsements]);

  const inputClass =
    "w-full text-right text-sm bg-transparent border-b border-[#C07A4A] focus:outline-none text-[#1E2A44] py-1 font-sans";

  const labelClass = "text-xs uppercase tracking-widest text-[#4B5563] font-sans";

  const rowClass =
    "flex justify-between items-center py-3 border-b border-[#E9EDF3]";

  return (
    <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
      <SEOHead
        title="Texas Title Premium Calculator | Official TDI Rates"
        description="Calculate Texas title insurance premiums based on official Texas Department of Insurance promulgated rates. Owner's policy, loan policy and endorsement costs."
        keywords="Texas title insurance calculator, title premium calculator Texas, owner title policy cost Texas, TDI title rates"
        ogUrl="https://aurarealty.com/title-calculator"
      />
      <Navbar />
      <style>{`.title-results [class*="text-white"] { color: #1E2A44 !important; } .title-results [class*="border-white"] { border-color: #E9EDF3 !important; }`}</style>

      <header className="public-page-header">
        <p className="public-page-eyebrow">Title Tools</p>
        <h1 className="public-page-title">Texas Title Premium Calculator</h1>
        <div className="mx-auto my-3 h-px w-10 bg-[#C07A4A]" />
        <p className="public-page-subtitle">Calculate Owner's and Loan title policy premiums based on official Texas Department of Insurance rates</p>
      </header>

      {/* Calculator */}
      <section className="public-tool-inputs py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* ── LEFT: Inputs ── */}
          <div className="space-y-8">

            {/* Transaction Type */}
            <div className="bg-white p-8 border border-[#E9EDF3]">
              <h2 className="font-serif text-2xl text-[#1E2A44] mb-6">
                Transaction Type
              </h2>
              <div className="flex gap-0">
                {(["purchase", "refinance"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setTxType(type);
                      if (type === "refinance") setOwnerPolicy(false);
                      else setOwnerPolicy(true);
                    }}
                    className="flex-1 py-3 text-sm uppercase tracking-widest font-sans transition-colors"
                    style={{
                      backgroundColor: txType === type ? CHARCOAL : "transparent",
                      color: txType === type ? "#fff" : "#4B5563",
                      border: `1px solid ${txType === type ? CHARCOAL : "#E9EDF3"}`,
                    }}
                  >
                    {type === "purchase" ? "Purchase" : "Refinance"}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Information */}
            <div className="bg-white p-8 border border-[#E9EDF3]">
              <h2 className="font-serif text-2xl text-[#1E2A44] mb-6">
                Property Information
              </h2>

              <div className={rowClass}>
                <label className={labelClass}>
                  {txType === "purchase" ? "Sale / Property Value" : "Property Value"}
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-[#4B5563]">$</span>
                  <input
                    type="number"
                    value={propertyValue}
                    onChange={e => setPropertyValue(Number(e.target.value))}
                    className={inputClass}
                    style={{ width: "9rem" }}
                    step={5000}
                  />
                </div>
              </div>

              {loanPolicy && (
                <div className={rowClass}>
                  <label className={labelClass}>Loan Amount</label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-[#4B5563]">$</span>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={e => setLoanAmount(Number(e.target.value))}
                      className={inputClass}
                      style={{ width: "9rem" }}
                      step={5000}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Policy Selection */}
            <div className="bg-white p-8 border border-[#E9EDF3]">
              <h2 className="font-serif text-2xl text-[#1E2A44] mb-6">
                Policy Selection
              </h2>

              {txType === "purchase" && (
                <label className={`${rowClass} cursor-pointer select-none`}>
                  <span className={labelClass}>Owner's Title Policy</span>
                  <input
                    type="checkbox"
                    checked={ownerPolicy}
                    onChange={e => setOwnerPolicy(e.target.checked)}
                    className="w-4 h-4 accent-[#C07A4A]"
                  />
                </label>
              )}

              <label className={`${rowClass} cursor-pointer select-none`}>
                <span className={labelClass}>Loan / Mortgagee Policy</span>
                <input
                  type="checkbox"
                  checked={loanPolicy}
                  onChange={e => setLoanPolicy(e.target.checked)}
                  className="w-4 h-4 accent-[#C07A4A]"
                />
              </label>

              {calc.simultaneous && (
                <p className="text-xs text-[#4B5563] font-sans mt-3">
                  Simultaneous issue discount applied — loan policy rate is significantly reduced.
                </p>
              )}
            </div>

            {/* Endorsements */}
            <div className="bg-white p-8 border border-[#E9EDF3]">
              <h2 className="font-serif text-2xl text-[#1E2A44] mb-2">
                Endorsements
              </h2>
              <p className="text-xs text-[#4B5563] font-sans mb-6">
                Each endorsement adds a fixed fee to the total premium
              </p>
              {ENDORSEMENTS.map(e => (
                <label
                  key={e.id}
                  className={`${rowClass} cursor-pointer select-none`}
                >
                  <div>
                    <span className={labelClass}>{e.label}</span>
                    <span className="block text-xs text-[#A8653A] font-sans mt-0.5">
                      +${e.fee}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!endorsements[e.id]}
                    onChange={() => toggleEndorsement(e.id)}
                    className="w-4 h-4 accent-[#C07A4A] flex-shrink-0"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Results ── */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div style={{ backgroundColor: "#F7F8FA", border: "1px solid #E9EDF3", borderRadius: 12 }} className="title-results p-8">
              <h2 className="font-serif text-2xl text-[#1E2A44] mb-8">
                Premium Breakdown
              </h2>

              {/* Summary values */}
              <div className="border-b border-[#E9EDF3] pb-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-white/50 uppercase tracking-widest text-xs">
                    Property Value
                  </span>
                  <span className="text-white">{fmt(propertyValue)}</span>
                </div>
                {loanPolicy && (
                  <div className="flex justify-between text-sm font-sans">
                    <span className="text-white/50 uppercase tracking-widest text-xs">
                      Loan Amount
                    </span>
                    <span className="text-white">{fmt(loanAmount)}</span>
                  </div>
                )}
              </div>

              {/* Title premiums */}
              <div className="border-b border-white/15 pb-4 mb-4 space-y-2">
                {calc.showOwner && (
                  <div className="flex justify-between text-sm font-sans">
                    <span className="text-white/70">Owner's Title Policy</span>
                    <span className="text-white">{fmt(calc.ownerPremium)}</span>
                  </div>
                )}
                {calc.showLoan && (
                  <div className="flex justify-between text-sm font-sans">
                    <span className="text-white/70">
                      Loan Policy{calc.simultaneous ? " (Simultaneous)" : ""}
                    </span>
                    <span className="text-white">{fmt(calc.loanPremium)}</span>
                  </div>
                )}
                {!calc.showOwner && !calc.showLoan && (
                  <p className="text-white/40 text-sm font-sans">
                    Select at least one policy above
                  </p>
                )}
              </div>

              {/* Endorsements */}
              {calc.endorsementTotal > 0 && (
                <div className="border-b border-white/15 pb-4 mb-4 space-y-2">
                  <p className="text-white/50 uppercase tracking-widest text-xs font-sans mb-2">
                    Endorsements
                  </p>
                  {ENDORSEMENTS.filter(e => endorsements[e.id]).map(e => (
                    <div key={e.id} className="flex justify-between text-sm font-sans">
                      <span className="text-white/70">{e.label.split(" ").slice(0, 2).join(" ")}</span>
                      <span className="text-white">${e.fee}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total title premium */}
              <div className="border-b border-white/15 pb-4 mb-4">
                <div className="flex justify-between items-center">
                  <span
                    className="text-sm uppercase tracking-widest font-sans font-medium"
                    style={{ color: "#1E2A44" }}
                  >
                    Total Title Premium
                  </span>
                  <span
                    className="font-serif text-2xl font-light"
                    style={{ color: "#1E2A44" }}
                  >
                    {fmt(calc.titlePremium + calc.endorsementTotal)}
                  </span>
                </div>
              </div>

              {/* Additional fees */}
              <div className="border-b border-white/15 pb-4 mb-4 space-y-2">
                <p className="text-white/50 uppercase tracking-widest text-xs font-sans mb-2">
                  Additional Fees (estimates)
                </p>
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-white/70">Title Search</span>
                  <span className="text-white">{fmt(calc.titleSearch)}</span>
                </div>
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-white/70">Escrow / Closing Fee</span>
                  <span className="text-white">{fmt(calc.escrow)}</span>
                </div>
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-white/70">Recording Fees</span>
                  <span className="text-white">{fmt(calc.recording)}</span>
                </div>
              </div>

              {/* Grand total */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-white uppercase tracking-widest text-xs font-sans font-medium">
                  Estimated Total Closing
                </span>
                <span className="font-serif text-3xl font-light text-white">
                  {fmt(calc.estimatedTotal)}
                </span>
              </div>
              <p className="text-white/30 text-xs font-sans mb-8">
                Title-related costs only
              </p>

              {/* Disclaimer */}
              <p className="text-white/30 text-xs font-sans leading-relaxed">
                Rates based on Texas Department of Insurance promulgated rates. All
                title companies in Texas charge the same premium — rates are set by
                the state.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Info Cards */}
      <section style={{ backgroundColor: CREAM }} className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

          {[
            {
              title: "Why Title Insurance?",
              body:
                "Title insurance protects you against hidden defects, undisclosed liens, errors in public records, and other title problems that could threaten your ownership — even years after closing.",
            },
            {
              title: "Owner's vs Loan Policy",
              body:
                "An Owner's Policy protects you, the buyer, and covers the full purchase price. A Loan Policy protects the lender up to the loan amount. Most transactions use both.",
            },
            {
              title: "One-Time Premium",
              body:
                "Unlike homeowner's insurance, title insurance is a one-time premium paid at closing. Your Owner's Policy protects you for as long as you or your heirs own the property.",
            },
          ].map(card => (
            <div
              key={card.title}
              className="bg-white p-8 border border-[#E9EDF3]"
            >
              <div
                className="w-8 mb-5"
                style={{ height: "2px", backgroundColor: GOLD }}
              />
              <h3 className="font-serif text-xl text-[#1E2A44] mb-4">
                {card.title}
              </h3>
              <p className="text-sm text-[#4B5563] font-sans leading-relaxed">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: CHARCOAL }} className="py-20 px-6 text-center">
        <p
          className="text-xs uppercase tracking-widest font-sans mb-4"
          style={{ color: "#FFFFFF" }}
        >
          Get Expert Guidance
        </p>
        <h2 className="font-serif text-4xl font-light text-white mb-4">
          Need Help Understanding Your Title Costs?
        </h2>
        <p className="text-white/75 font-sans mb-10">
          Our agents work with trusted title companies across Central Texas
        </p>
        <a
          href="/#contact"
          className="public-button-primary inline-block px-10 py-4 font-sans text-sm uppercase tracking-widest"
          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#8F5530")}
          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#A8653A")}
        >
          Contact an Agent
        </a>
      </section>

      <MailingList />
      <Footer />
    </div>
  );
};

export default TitleCalculator;
