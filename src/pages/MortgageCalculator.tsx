import { useState, useMemo } from "react";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MailingList from "@/components/MailingList";

type LoanType = "conventional" | "fha" | "va" | "usda";

const creditScoreOptions = [
  { label: "760 – 850", value: "760" },
  { label: "720 – 759", value: "720" },
  { label: "680 – 719", value: "680" },
  { label: "640 – 679", value: "640" },
  { label: "600 – 639", value: "600" },
  { label: "Below 600", value: "580" },
];

const pmiRates: Record<string, number> = {
  "760": 0.002,
  "720": 0.004,
  "680": 0.006,
  "640": 0.009,
  "600": 0.012,
  "580": 0.015,
};

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtUSD(n: number) {
  return "$" + fmt(Math.round(n));
}

export default function MortgageCalculator() {
  const [purchasePrice, setPurchasePrice] = useState("500000");
  const [downPaymentAmt, setDownPaymentAmt] = useState("100000");
  const [downPaymentPct, setDownPaymentPct] = useState("20");
  const [loanTerm, setLoanTerm] = useState("30");
  const [interestRate, setInterestRate] = useState("7.5");
  const [creditScore, setCreditScore] = useState("760");
  const [propertyTaxRate, setPropertyTaxRate] = useState("2");
  const [insuranceRate, setInsuranceRate] = useState("0.5");
  const [hoaFee, setHoaFee] = useState("0");
  const [loanType, setLoanType] = useState<LoanType>("conventional");

  const price = parseFloat(purchasePrice.replace(/,/g, "")) || 0;
  const downAmt = parseFloat(downPaymentAmt.replace(/,/g, "")) || 0;

  function syncFromAmt(raw: string) {
    setDownPaymentAmt(raw);
    const val = parseFloat(raw.replace(/,/g, "")) || 0;
    if (price > 0) setDownPaymentPct(((val / price) * 100).toFixed(2));
  }

  function syncFromPct(raw: string) {
    setDownPaymentPct(raw);
    const pct = parseFloat(raw) || 0;
    setDownPaymentAmt(String(Math.round((pct / 100) * price)));
  }

  function applyQuickPct(pct: number) {
    const amt = Math.round((pct / 100) * price);
    setDownPaymentPct(String(pct));
    setDownPaymentAmt(String(amt));
  }

  const results = useMemo(() => {
    const r = (parseFloat(interestRate) || 0) / 100 / 12;
    const termYears = parseInt(loanTerm) || 30;
    const n = termYears * 12;
    const taxRate = (parseFloat(propertyTaxRate) || 0) / 100;
    const insRate = (parseFloat(insuranceRate) || 0) / 100;
    const hoa = parseFloat(hoaFee) || 0;

    let effectiveDown = downAmt;
    let baseLoan = price - effectiveDown;
    if (loanType === "usda") { effectiveDown = 0; baseLoan = price; }

    let upfrontFee = 0;
    if (loanType === "fha") upfrontFee = baseLoan * 0.0175;
    if (loanType === "va") upfrontFee = baseLoan * 0.0215;
    if (loanType === "usda") upfrontFee = baseLoan * 0.01;

    const loanAmount = baseLoan + upfrontFee;

    let pi = 0;
    if (r > 0) {
      pi = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else {
      pi = loanAmount / n;
    }

    const propertyTax = (price * taxRate) / 12;
    const insurance = (price * insRate) / 12;

    const dpPct = price > 0 ? effectiveDown / price : 0;
    let pmi = 0;
    if (loanType === "conventional" && dpPct < 0.2) {
      pmi = (loanAmount * (pmiRates[creditScore] ?? 0.006)) / 12;
    }
    let mip = 0;
    if (loanType === "fha") mip = (loanAmount * 0.0085) / 12;
    let usdaAnnual = 0;
    if (loanType === "usda") usdaAnnual = (loanAmount * 0.0035) / 12;

    const pmiMipLabel =
      loanType === "fha" ? "FHA MIP" :
      loanType === "usda" ? "USDA Annual Fee" :
      "PMI";

    const pmiMipAmount = loanType === "fha" ? mip : loanType === "usda" ? usdaAnnual : pmi;

    const total = pi + propertyTax + insurance + pmiMipAmount + hoa;
    const totalPayments = pi * n;
    const totalInterest = totalPayments - loanAmount;

    const income = (ratio: number) => (total * 12) / ratio;

    return {
      pi,
      propertyTax,
      insurance,
      pmiMipLabel,
      pmiMipAmount,
      hoa,
      total,
      loanAmount,
      effectiveDown,
      totalPayments: totalPayments + pmiMipAmount * n + propertyTax * n + insurance * n + hoa * n,
      totalInterest,
      income25: income(0.25),
      income28: income(0.28),
      income36: income(0.36),
      income43: income(0.43),
    };
  }, [purchasePrice, downPaymentAmt, loanTerm, interestRate, creditScore, propertyTaxRate, insuranceRate, hoaFee, loanType, price, downAmt]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Mortgage Calculator | Texas Home Payment Estimator"
        description="Calculate your monthly mortgage payment including taxes, insurance, PMI and HOA. FHA, VA, USDA and Conventional loan calculators for Texas home buyers."
        keywords="mortgage calculator Texas, FHA loan calculator Austin, VA loan calculator, USDA loan Texas, home payment calculator Central Texas"
        ogUrl="https://aurarealty.com/mortgage-calculator"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-10 mt-16">
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2">
            Mortgage Calculator
          </h1>
          <p className="text-muted-foreground font-sans text-sm">
            Estimate your monthly payment including taxes, insurance, PMI, and HOA.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ── Inputs ── */}
          <div className="w-full lg:w-[55%] space-y-5">

            {/* Loan Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-base text-primary">Loan Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={loanType} onValueChange={(v) => setLoanType(v as LoanType)}>
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="conventional">Conventional</TabsTrigger>
                    <TabsTrigger value="fha">FHA</TabsTrigger>
                    <TabsTrigger value="va">VA</TabsTrigger>
                    <TabsTrigger value="usda">USDA</TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-muted-foreground mt-3 font-sans">
                  {loanType === "conventional" && "Standard loan. PMI required if down payment < 20%."}
                  {loanType === "fha" && "FHA loan. 1.75% upfront MIP + 0.85% annual MIP added to payment."}
                  {loanType === "va" && "VA loan. 2.15% funding fee added to loan. No PMI required."}
                  {loanType === "usda" && "USDA loan. No down payment required. 1% upfront + 0.35% annual fee."}
                </p>
              </CardContent>
            </Card>

            {/* Purchase Price */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-base text-primary">Purchase Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    data-testid="input-purchase-price"
                    className="pl-7 font-sans"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Down Payment */}
            {loanType !== "usda" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-base text-primary">Down Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        data-testid="input-down-payment-amount"
                        className="pl-7 font-sans"
                        value={downPaymentAmt}
                        onChange={(e) => syncFromAmt(e.target.value)}
                        inputMode="numeric"
                      />
                    </div>
                    <div className="relative w-28">
                      <Input
                        data-testid="input-down-payment-pct"
                        className="pr-7 font-sans"
                        value={downPaymentPct}
                        onChange={(e) => syncFromPct(e.target.value)}
                        inputMode="decimal"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[3, 5, 10, 20].map((pct) => (
                      <Button
                        key={pct}
                        variant="publicSecondary"
                        size="sm"
                        data-testid={`button-down-pct-${pct}`}
                        className="font-sans text-xs"
                        onClick={() => applyQuickPct(pct)}
                      >
                        {pct}%
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loan Terms */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-base text-primary">Loan Terms</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-muted-foreground">Loan Term</label>
                  <Select value={loanTerm} onValueChange={setLoanTerm}>
                    <SelectTrigger data-testid="select-loan-term" className="font-sans">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["5", "10", "15", "20", "25", "30"].map((y) => (
                        <SelectItem key={y} value={y}>{y} years</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-muted-foreground">Interest Rate</label>
                  <div className="relative">
                    <Input
                      data-testid="input-interest-rate"
                      className="pr-7 font-sans"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      inputMode="decimal"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-muted-foreground">Credit Score Range</label>
                  <Select value={creditScore} onValueChange={setCreditScore}>
                    <SelectTrigger data-testid="select-credit-score" className="font-sans">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {creditScoreOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Costs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-base text-primary">Monthly Costs</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-muted-foreground">Property Tax Rate</label>
                  <div className="relative">
                    <Input
                      data-testid="input-property-tax"
                      className="pr-7 font-sans"
                      value={propertyTaxRate}
                      onChange={(e) => setPropertyTaxRate(e.target.value)}
                      inputMode="decimal"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-muted-foreground">Home Insurance Rate</label>
                  <div className="relative">
                    <Input
                      data-testid="input-insurance-rate"
                      className="pr-7 font-sans"
                      value={insuranceRate}
                      onChange={(e) => setInsuranceRate(e.target.value)}
                      inputMode="decimal"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-muted-foreground">HOA (monthly)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      data-testid="input-hoa"
                      className="pl-7 font-sans"
                      value={hoaFee}
                      onChange={(e) => setHoaFee(e.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Results ── */}
          <div className="w-full lg:w-[45%] lg:sticky lg:top-24 space-y-5">

            {/* Total Monthly Payment */}
            <Card className="border-accent/40 shadow-lg">
              <CardContent className="pt-6 pb-5 text-center">
                <p className="font-sans text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p>
                <p
                  data-testid="text-total-monthly-payment"
                  className="font-serif text-5xl font-bold text-primary leading-none"
                >
                  {fmtUSD(results.total)}
                </p>
                <p className="text-xs text-muted-foreground font-sans mt-2">per month</p>
              </CardContent>
            </Card>

            {/* Payment Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-base text-primary">Payment Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm font-sans">
                  <tbody>
                    {[
                      { label: "Principal & Interest", value: results.pi },
                      { label: "Property Tax", value: results.propertyTax },
                      { label: "Home Insurance", value: results.insurance },
                      ...(results.pmiMipAmount > 0
                        ? [{ label: results.pmiMipLabel, value: results.pmiMipAmount }]
                        : []),
                      ...(results.hoa > 0
                        ? [{ label: "HOA Fee", value: results.hoa }]
                        : []),
                    ].map((row, i, arr) => (
                      <tr
                        key={row.label}
                        data-testid={`row-breakdown-${i}`}
                        className={i < arr.length - 1 ? "border-b border-border/50" : ""}
                      >
                        <td className="px-4 py-3 text-muted-foreground">{row.label}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {fmtUSD(row.value)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted/40 font-semibold border-t border-border">
                      <td className="px-4 py-3 text-foreground">Total Monthly</td>
                      <td className="px-4 py-3 text-right text-primary">{fmtUSD(results.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Loan Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-base text-primary">Loan Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm font-sans">
                  <tbody>
                    {[
                      { label: "Purchase Price", value: fmtUSD(price) },
                      { label: "Down Payment", value: fmtUSD(loanType === "usda" ? 0 : downAmt) },
                      { label: "Loan Amount", value: fmtUSD(results.loanAmount) },
                      { label: "Total of All Payments", value: fmtUSD(results.totalPayments) },
                      { label: "Total Interest Paid", value: fmtUSD(results.totalInterest) },
                    ].map((row, i, arr) => (
                      <tr
                        key={row.label}
                        data-testid={`row-summary-${i}`}
                        className={i < arr.length - 1 ? "border-b border-border/50" : ""}
                      >
                        <td className="px-4 py-3 text-muted-foreground">{row.label}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Income Benchmarks */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-base text-primary">Required Annual Income</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-4 py-2 text-left text-xs text-muted-foreground font-medium">Housing Ratio</th>
                      <th className="px-4 py-2 text-right text-xs text-muted-foreground font-medium">Annual Income</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { ratio: "25%", value: results.income25 },
                      { ratio: "28%", value: results.income28 },
                      { ratio: "36%", value: results.income36 },
                      { ratio: "43%", value: results.income43 },
                    ].map((row, i, arr) => (
                      <tr
                        key={row.ratio}
                        data-testid={`row-income-${i}`}
                        className={i < arr.length - 1 ? "border-b border-border/50" : ""}
                      >
                        <td className="px-4 py-3 text-muted-foreground">{row.ratio} ratio</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{fmtUSD(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      <MailingList />
      <Footer />
    </div>
  );
}
