// Educational agent – serves quizzes and articles about misinformation

export type Article = { title: string; body: string };
export type Quiz = { question: string; options: string[]; answerIdx: number };

const articles: Article[] = [
  {
    title: "How to Identify Fake News",
    body: "Check the source domain (e.g., .gov, .edu), cross-verify information on reputable websites, look for peer-reviewed references, and beware of overly sensational claims."
  },
  {
    title: "Best Practices for Fact-Checking",
    body: "Always read beyond headlines, use fact-checking portals (e.g., Snopes, FactCheck.org), and avoid spreading news without verification."
  }
];

const quizzes: Quiz[] = [
  {
    question: "Which domain is considered highly credible?",
    options: [".gov", ".com", ".blog", ".info"],
    answerIdx: 0
  },
  {
    question: "What is the first step in fact-checking?",
    options: ["Post to social media", "Verify with reputable sites", "Ignore the news", "Rely on rumors"],
    answerIdx: 1
  }
];

export function getArticle(index: number): Article {
  return articles[index % articles.length];
}

export function getQuiz(index: number): Quiz {
  return quizzes[index % quizzes.length];
}
