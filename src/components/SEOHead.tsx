import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  schema?: object;
}

const SEOHead = ({ title, description, keywords, ogImage, ogUrl, schema }: SEOHeadProps) => (
  <Helmet>
    <title>{title || 'Texas Realty Hub | Austin & Central Texas Real Estate'}</title>
    <meta name="description" content={description || 'Premium real estate services in Austin and Central Texas.'} />
    {keywords && <meta name="keywords" content={keywords} />}
    <meta property="og:title" content={title || 'Texas Realty Hub'} />
    <meta property="og:description" content={description || ''} />
    <meta property="og:image" content={ogImage || 'https://xxiwznuuaouwsugtgsut.supabase.co/storage/v1/object/public/agent-photos/LogoWithTransBackgrnd%20(1).png'} />
    <meta property="og:url" content={ogUrl || 'https://texasrealtyhub.com'} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title || 'Texas Realty Hub'} />
    <meta name="twitter:description" content={description || ''} />
    {ogUrl && <link rel="canonical" href={ogUrl} />}
    {schema && <script type="application/ld+json">{JSON.stringify(schema)}</script>}
  </Helmet>
);

export default SEOHead;
