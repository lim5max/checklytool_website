export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ChecklyTool",
    "description": "Быстрая проверка работ школьников. Приложение проверит, подсчитает баллы и оценит работу за тебя.",
    "url": "https://checklytool.com",
    "logo": "https://checklytool.com/images/brand-logo.png",
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service"
    },
    "offers": {
      "@type": "Offer",
      "name": "Проверка работ школьников",
      "description": "Автоматическая проверка и оценка работ учеников",
      "price": "200",
      "priceCurrency": "RUB",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": "100"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}