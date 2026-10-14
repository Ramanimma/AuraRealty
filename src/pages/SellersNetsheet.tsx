import { useState, useMemo } from "react";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MailingList from "@/components/MailingList";
import PublicPageHeader from "@/components/PublicPageHeader";

const SellersNetsheet = () => {
  const [salePrice, setSalePrice] = useState(450000);
  const [mortgage, setMortgage] = useState(250000);
  const [annualTax, setAnnualTax] = useState(8000);
  const [listingComm, setListingComm] = useState(3);
  const [buyerComm, setBuyerComm] = useState(3);
  const [titleSearch, setTitleSearch] = useState(200);
  const [survey, setSurvey] = useState(500);
  const [recording, setRecording] = useState(150);
  const [hoaTransfer, setHoaTransfer] = useState(0);
  const [warranty, setWarranty] = useState(0);
  const [repairs, setRepairs] = useState(0);

  const calc = useMemo(() => {
    const listingCommAmt = (salePrice * listingComm) / 100;
    const buyerCommAmt = (salePrice * buyerComm) / 100;

    let titlePolicy = 0;
    if (salePrice <= 100000) {
      titlePolicy = salePrice * 0.00575;
    } else if (salePrice <= 1000000) {
      titlePolicy = 575 + (salePrice - 100000) * 0.00475;
    } else {
      titlePolicy = 4825 + (salePrice - 1000000) * 0.00375;
    }
    titlePolicy = Math.round(titlePolicy);

    const today = new Date();
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    const daysLeft = Math.round((endOfYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const proratedTax = Math.round((annualTax / 365) * daysLeft);

    const totalDeductions =
      mortgage + listingCommAmt + buyerCommAmt + titlePolicy +
      titleSearch + survey + recording + hoaTransfer + warranty +
      repairs + proratedTax;

    const netProceeds = salePrice - totalDeductions;
    const netPct = ((netProceeds / salePrice) * 100).toFixed(1);

    return {
      listingCommAmt,
      buyerCommAmt,
      titlePolicy,
      proratedTax,
      daysLeft,
      totalDeductions,
      netProceeds,
      netPct,
    };
  }, [salePrice, mortgage, annualTax, listingComm, buyerComm,
      titleSearch, survey, recording, hoaTransfer, warranty, repairs]);

  const fmt = (n: number) =>
    n < 0
      ? `-$${Math.abs(Math.round(n)).toLocaleString()}`
      : `$${Math.round(n).toLocaleString()}`;

  const InputRow = ({ label, value, onChange, prefix = "$", step = 1000 }: {
    label: string; value: number; onChange: (v: number) => void; prefix?: string; step?: number;
  }) => (
    <div className="flex justify-between items-center py-3 border-b border-[#E9EDF3]">
      <label className="text-sm uppercase tracking-widest text-[#4B5563] font-sans">{label}</label>
      <div className="flex items-center gap-1">
        <span className="text-sm text-[#4B5563]">{prefix}</span>
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-32 text-right text-sm font-sans bg-transparent border-b border-[#C07A4A] focus:outline-none text-[#1E2A44] py-1"
          step={step}
        />
      </div>
    </div>
  );

  const PctRow = ({ label, value, onChange }: {
    label: string; value: number; onChange: (v: number) => void;
  }) => (
    <div className="flex justify-between items-center py-3 border-b border-[#E9EDF3]">
      <label className="text-sm uppercase tracking-widest text-[#4B5563] font-sans">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-16 text-right text-sm font-sans bg-transparent border-b border-[#C07A4A] focus:outline-none text-[#1E2A44] py-1"
          step={0.25}
          min={0}
          max={10}
        />
        <span className="text-sm text-[#4B5563]">%</span>
      </div>
    </div>
  );

  const ResultRow = ({ label, amount, isDeduction = false }: {
    label: string; amount: number; isDeduction?: boolean;
  }) => (
    <div className="flex justify-between items-center py-2 border-b border-[#E9EDF3]">
      <span className="text-sm font-sans text-[#4B5563]">{label}</span>
      <span className={`text-sm font-sans ${isDeduction ? "text-[#C07A4A]" : "text-white"}`}>
        {isDeduction ? `-${fmt(amount)}` : fmt(amount)}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <SEOHead
        title="Sellers Net Sheet Calculator | How Much Will I Make Selling My Home in Texas?"
        description="Calculate your estimated net proceeds from selling your home in Texas. Includes agent commission, title fees, closing costs and prorated taxes."
        keywords="sellers net sheet Texas, how much will I make selling my home, closing costs Texas seller, net proceeds home sale calculator"
        ogUrl="https://aurarealty.com/sellers-netsheet"
      />
      <Navbar />
      <style>{`.seller-results [class*="text-white"] { color: #1E2A44 !important; } .seller-results [class*="border-white"] { border-color: #E9EDF3 !important; }`}</style>

      {/* Hero */}
      <PublicPageHeader eyebrow="Seller Tools" title="How Much Will You Make?" subtitle="Get an instant estimate of your net proceeds after all closing costs" />

      {/* Calculator */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Inputs */}
          <div className="space-y-8">
            {/* Property Info */}
            <div className="bg-white p-8 border border-[#E9EDF3]">
              <h2 className="font-serif text-2xl text-[#1E2A44] mb-6">Property Information</h2>
              <InputRow label="Sale Price" value={salePrice} onChange={setSalePrice} step={5000} />
              <InputRow label="Mortgage Balance" value={mortgage} onChange={setMortgage} step={5000} />
              <InputRow label="Annual Property Tax" value={annualTax} onChange={setAnnualTax} step={500} />
            </div>

            {/* Commission */}
            <div className="bg-white p-8 border border-[#E9EDF3]">
              <h2 className="font-serif text-2xl text-[#1E2A44] mb-6">Agent Commission</h2>
              <PctRow label="Listing Agent %" value={listingComm} onChange={setListingComm} />
              <PctRow label="Buyer Agent %" value={buyerComm} onChange={setBuyerComm} />
              <div className="flex justify-between items-center py-3">
                <span className="text-sm uppercase tracking-widest text-[#4B5563] font-sans">Total Commission</span>
                <span className="text-sm font-sans text-[#C07A4A] font-medium">{listingComm + buyerComm}%</span>
              </div>
            </div>

            {/* Closing Costs */}
            <div className="bg-white p-8 border border-[#E9EDF3]">
              <h2 className="font-serif text-2xl text-[#1E2A44] mb-2">Title & Closing Costs</h2>
              <p className="text-xs text-[#4B5563] font-sans mb-6">Owner title policy auto-calculated per Texas rate table</p>
              <div className="flex justify-between items-center py-3 border-b border-[#E9EDF3]">
                <span className="text-sm uppercase tracking-widest text-[#4B5563] font-sans">Owner Title Policy</span>
                <span className="text-sm font-sans text-[#1E2A44]">{fmt(calc.titlePolicy)}</span>
              </div>
              <InputRow label="Title Search" value={titleSearch} onChange={setTitleSearch} step={50} />
              <InputRow label="Survey" value={survey} onChange={setSurvey} step={50} />
              <InputRow label="Recording Fees" value={recording} onChange={setRecording} step={25} />
              <InputRow label="HOA Transfer Fee" value={hoaTransfer} onChange={setHoaTransfer} step={50} />
              <InputRow label="Home Warranty" value={warranty} onChange={setWarranty} step={100} />
              <InputRow label="Repairs / Concessions" value={repairs} onChange={setRepairs} step={500} />
              <div className="flex justify-between items-center py-3">
                <span className="text-sm uppercase tracking-widest text-[#4B5563] font-sans">
                  Prorated Tax ({calc.daysLeft} days)
                </span>
                <span className="text-sm font-sans text-[#1E2A44]">{fmt(calc.proratedTax)}</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="seller-results rounded-xl border border-[#E9EDF3] bg-[#F7F8FA] p-8">
              <h2 className="font-serif text-2xl text-[#1E2A44] mb-8">Your Net Proceeds</h2>

              {/* Net Proceeds Hero */}
              <div className="text-center py-8 border-b border-[#E9EDF3] mb-8">
                <p className="text-xs uppercase tracking-widest text-[#4B5563] font-sans mb-2">Estimated Net Proceeds</p>
                <p className="font-serif text-5xl font-light mb-2 text-[#1E2A44]">
                  {fmt(calc.netProceeds)}
                </p>
                <p className="text-[#4B5563] font-sans text-sm">{calc.netPct}% of sale price</p>
              </div>

              {/* Breakdown */}
              <div className="space-y-0">
                <div className="flex justify-between items-center py-2 border-b border-[#E9EDF3]">
                  <span className="text-sm font-sans text-[#1E2A44] font-medium">Sale Price</span>
                  <span className="text-sm font-sans text-[#1E2A44] font-medium">{fmt(salePrice)}</span>
                </div>
                <ResultRow label="Mortgage Payoff" amount={mortgage} isDeduction />
                <ResultRow label={`Listing Commission (${listingComm}%)`} amount={calc.listingCommAmt} isDeduction />
                <ResultRow label={`Buyer Commission (${buyerComm}%)`} amount={calc.buyerCommAmt} isDeduction />
                <ResultRow label="Owner Title Policy" amount={calc.titlePolicy} isDeduction />
                <ResultRow label="Title Search" amount={titleSearch} isDeduction />
                <ResultRow label="Survey" amount={survey} isDeduction />
                <ResultRow label="Recording Fees" amount={recording} isDeduction />
                {hoaTransfer > 0 && <ResultRow label="HOA Transfer" amount={hoaTransfer} isDeduction />}
                {warranty > 0 && <ResultRow label="Home Warranty" amount={warranty} isDeduction />}
                {repairs > 0 && <ResultRow label="Repairs/Concessions" amount={repairs} isDeduction />}
                <ResultRow label={`Prorated Tax (${calc.daysLeft} days)`} amount={calc.proratedTax} isDeduction />
              </div>

              <p className="text-[#4B5563] text-xs font-sans mt-8 text-center">
                This is an estimate only. Actual closing costs may vary. Contact your agent for a detailed analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1E2A44] py-20 px-6 text-center">
        <p className="text-[#C07A4A] text-xs uppercase tracking-widest font-sans mb-4">Ready to Sell?</p>
        <h2 className="font-serif text-4xl font-light text-white mb-4">Get Your Free Market Analysis</h2>
        <p className="text-white/60 font-sans mb-10">Our agents will provide a personalized net sheet based on real market data</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="/home-valuation"
            className="public-button-primary px-8 py-4 font-sans text-sm uppercase tracking-widest">
            Request Free Valuation
          </a>
          <a href="/#contact"
            className="public-button-secondary public-button-secondary-dark px-8 py-4 font-sans text-sm uppercase tracking-widest">
            Contact an Agent
          </a>
        </div>
      </section>

      <MailingList />
      <Footer />
    </div>
  );
};

export default SellersNetsheet;
