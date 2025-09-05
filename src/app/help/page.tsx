
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is VEDA?",
    answer: "VEDA is an AI-powered platform designed to detect and combat misinformation by analyzing the authenticity of news, articles, and other forms of content.",
  },
  {
    question: "How do I submit content for verification?",
    answer: "You can submit content by pasting text or a URL into the input box on the user dashboard or the landing page. You can also upload files like images or documents for analysis.",
  },
  {
    question: "What types of content can VEDA analyze?",
    answer: "VEDA can analyze text, links to articles, images, and documents. The AI provides a verdict on the content's authenticity based on its analysis.",
  },
  {
    question: "What do the different user roles mean?",
    answer: "The application has several roles: Civic Users can submit reports, while Sentinels, Ground Sentinels, and Council members have increasing levels of responsibility for investigating, verifying, and overseeing the cases.",
  },
  {
    question: "How accurate is the AI analysis?",
    answer: "The AI provides a verdict (True, Fake, Unverifiable) along with a confidence score. While highly advanced, we always recommend cross-referencing critical information with the sources provided.",
  },
  {
    question: "What happens after I submit a report?",
    answer: "After an initial AI analysis, your report is logged in our system and queued for review by the appropriate agency or sentinel for further investigation if needed.",
  },
];

export default function HelpPage() {
  return (
    <div className="container py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Frequently Asked Questions</CardTitle>
          <CardDescription>
            Find answers to common questions about VEDA and its features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
