/**
 * QuizBuilder - Converts verification results and key facts into interactive quizzes
 */

import Handlebars from 'handlebars';
import {
  VerificationResult,
  Quiz,
  QuizQuestion,
  QuestionType,
  LiteracyLevel,
  MisinformationCategory,
  UserProfile,
  QuizTemplateData,
  EducationalContent
} from './types';

export class QuizBuilder {
  private questionTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private quizTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.initializeTemplates();
    this.registerHelpers();
  }

  /**
   * Generate quiz from verification results
   */
  public generateQuiz(
    results: VerificationResult[],
    userProfile: UserProfile,
    options: QuizGenerationOptions = {}
  ): Quiz {
    const questions = this.generateQuestions(results, userProfile, options);
    
    return {
      id: `quiz_${Date.now()}_${userProfile.id}`,
      title: this.generateQuizTitle(results, userProfile),
      description: this.generateQuizDescription(results, userProfile),
      questions,
      difficulty: userProfile.literacyLevel,
      category: this.determinePrimaryCategory(results),
      timeLimit: this.calculateTimeLimit(questions, userProfile),
      passingScore: this.calculatePassingScore(userProfile),
      metadata: {
        estimatedTime: this.calculateQuizTime(questions),
        prerequisites: [],
        tags: this.extractQuizTags(results),
        version: '1.0.0',
        lastUpdated: new Date()
      }
    };
  }

  /**
   * Generate scenario-based quiz questions
   */
  public generateScenarioQuiz(
    scenarios: MisinformationScenario[],
    userProfile: UserProfile
  ): Quiz {
    const questions = scenarios.map(scenario => 
      this.createScenarioQuestion(scenario, userProfile)
    );

    return {
      id: `scenario_quiz_${Date.now()}_${userProfile.id}`,
      title: 'Real-World Misinformation Scenarios',
      description: 'Test your skills with realistic misinformation scenarios',
      questions,
      difficulty: userProfile.literacyLevel,
      category: MisinformationCategory.GENERAL,
      timeLimit: this.calculateTimeLimit(questions, userProfile),
      passingScore: this.calculatePassingScore(userProfile),
      metadata: {
        estimatedTime: this.calculateQuizTime(questions),
        prerequisites: [],
        tags: ['scenario', 'practical', 'real-world'],
        version: '1.0.0',
        lastUpdated: new Date()
      }
    };
  }

  /**
   * Generate adaptive quiz based on user progress
   */
  public generateAdaptiveQuiz(
    userProfile: UserProfile,
    weakAreas: string[],
    options: AdaptiveQuizOptions = {}
  ): Quiz {
    const questions = this.generateAdaptiveQuestions(userProfile, weakAreas, options);
    
    return {
      id: `adaptive_quiz_${Date.now()}_${userProfile.id}`,
      title: 'Personalized Learning Quiz',
      description: 'Quiz tailored to your learning needs',
      questions,
      difficulty: userProfile.literacyLevel,
      category: MisinformationCategory.GENERAL,
      timeLimit: this.calculateTimeLimit(questions, userProfile),
      passingScore: this.calculatePassingScore(userProfile),
      metadata: {
        estimatedTime: this.calculateQuizTime(questions),
        prerequisites: [],
        tags: ['adaptive', 'personalized', 'learning'],
        version: '1.0.0',
        lastUpdated: new Date()
      }
    };
  }

  /**
   * Export quiz as HTML for frontend rendering
   */
  public exportQuizAsHTML(quiz: Quiz, userProfile: UserProfile): string {
    const template = this.getQuizTemplate('html', userProfile.literacyLevel);
    const templateData: QuizTemplateData = {
      quiz,
      userLevel: userProfile.literacyLevel,
      language: userProfile.language
    };

    return template(templateData);
  }

  /**
   * Export quiz as JSON for API consumption
   */
  public exportQuizAsJSON(quiz: Quiz): string {
    return JSON.stringify(quiz, null, 2);
  }

  private generateQuestions(
    results: VerificationResult[],
    userProfile: UserProfile,
    options: QuizGenerationOptions
  ): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    const questionCount = options.questionCount || Math.min(results.length, 10);

    // Shuffle results for variety
    const shuffledResults = this.shuffleArray([...results]);

    for (let i = 0; i < Math.min(questionCount, shuffledResults.length); i++) {
      const result = shuffledResults[i];
      const questionType = this.selectQuestionType(result, userProfile);
      
      const question = this.createQuestion(result, questionType, userProfile);
      questions.push(question);
    }

    return questions;
  }

  private createQuestion(
    result: VerificationResult,
    type: QuestionType,
    userProfile: UserProfile
  ): QuizQuestion {
    const baseQuestion = {
      id: `q_${result.id}_${type}`,
      type,
      difficulty: userProfile.literacyLevel,
      points: this.calculateQuestionPoints(result, userProfile)
    };

    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return {
          ...baseQuestion,
          question: this.generateMultipleChoiceQuestion(result, userProfile),
          options: this.generateMultipleChoiceOptions(result, userProfile),
          correctAnswer: result.verdict,
          explanation: this.generateExplanation(result, userProfile)
        };

      case QuestionType.TRUE_FALSE:
        return {
          ...baseQuestion,
          question: this.generateTrueFalseQuestion(result, userProfile),
          correctAnswer: result.verdict === 'true' ? 'true' : 'false',
          explanation: this.generateExplanation(result, userProfile)
        };

      case QuestionType.SCENARIO:
        return {
          ...baseQuestion,
          question: this.generateScenarioQuestion(result, userProfile),
          options: this.generateScenarioOptions(result, userProfile),
          correctAnswer: this.getScenarioCorrectAnswer(result),
          explanation: this.generateExplanation(result, userProfile)
        };

      default:
        throw new Error(`Unsupported question type: ${type}`);
    }
  }

  private createScenarioQuestion(
    scenario: MisinformationScenario,
    userProfile: UserProfile
  ): QuizQuestion {
    return {
      id: `scenario_${scenario.id}`,
      type: QuestionType.SCENARIO,
      question: scenario.description,
      options: scenario.options,
      correctAnswer: scenario.correctAnswer,
      explanation: scenario.explanation,
      difficulty: userProfile.literacyLevel,
      points: 10
    };
  }

  private generateAdaptiveQuestions(
    userProfile: UserProfile,
    weakAreas: string[],
    options: AdaptiveQuizOptions
  ): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    const questionCount = options.questionCount || 5;

    // Generate questions targeting weak areas
    weakAreas.forEach(area => {
      if (questions.length < questionCount) {
        const question = this.createAdaptiveQuestion(area, userProfile);
        questions.push(question);
      }
    });

    // Fill remaining slots with general questions
    while (questions.length < questionCount) {
      const question = this.createGeneralQuestion(userProfile);
      questions.push(question);
    }

    return questions;
  }

  private createAdaptiveQuestion(
    weakArea: string,
    userProfile: UserProfile
  ): QuizQuestion {
    // This would typically pull from a question bank
    // For now, creating a generic adaptive question
    return {
      id: `adaptive_${weakArea}_${Date.now()}`,
      type: QuestionType.MULTIPLE_CHOICE,
      question: `Which of the following is the best way to verify information about ${weakArea}?`,
      options: [
        'Check multiple reliable sources',
        'Trust the first source you find',
        'Share immediately if it sounds right',
        'Only check social media sources'
      ],
      correctAnswer: 'Check multiple reliable sources',
      explanation: `When dealing with ${weakArea} information, always verify from multiple reliable sources to ensure accuracy.`,
      difficulty: userProfile.literacyLevel,
      points: 10
    };
  }

  private createGeneralQuestion(userProfile: UserProfile): QuizQuestion {
    return {
      id: `general_${Date.now()}`,
      type: QuestionType.TRUE_FALSE,
      question: 'Fact-checking websites are always 100% accurate.',
      correctAnswer: 'false',
      explanation: 'Even fact-checking websites can make mistakes. It\'s important to check multiple sources and use critical thinking.',
      difficulty: userProfile.literacyLevel,
      points: 5
    };
  }

  private selectQuestionType(
    result: VerificationResult,
    userProfile: UserProfile
  ): QuestionType {
    const types = [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE];
    
    if (userProfile.literacyLevel === LiteracyLevel.ADVANCED) {
      types.push(QuestionType.SCENARIO);
    }

    return types[Math.floor(Math.random() * types.length)];
  }

  private generateMultipleChoiceQuestion(
    result: VerificationResult,
    userProfile: UserProfile
  ): string {
    const level = userProfile.literacyLevel;
    
    if (level === LiteracyLevel.BEGINNER) {
      return `Is this information true or false?\n\n"${result.content.substring(0, 100)}..."`;
    } else if (level === LiteracyLevel.INTERMEDIATE) {
      return `Based on the verification analysis, what is the most accurate assessment of this information?\n\n"${result.content.substring(0, 150)}..."`;
    } else {
      return `Given the evidence analysis and verification methodology, what conclusion best represents the accuracy of this information?\n\n"${result.content.substring(0, 200)}..."`;
    }
  }

  private generateMultipleChoiceOptions(
    result: VerificationResult,
    userProfile: UserProfile
  ): string[] {
    const options = ['true', 'false', 'uncertain'];
    
    if (userProfile.literacyLevel === LiteracyLevel.BEGINNER) {
      return ['True', 'False'];
    } else {
      return ['True', 'False', 'Uncertain'];
    }
  }

  private generateTrueFalseQuestion(
    result: VerificationResult,
    userProfile: UserProfile
  ): string {
    const level = userProfile.literacyLevel;
    
    if (level === LiteracyLevel.BEGINNER) {
      return `True or False: This information is accurate.\n\n"${result.content.substring(0, 100)}..."`;
    } else {
      return `True or False: The verification process confirms this information as ${result.verdict}.\n\n"${result.content.substring(0, 150)}..."`;
    }
  }

  private generateScenarioQuestion(
    result: VerificationResult,
    userProfile: UserProfile
  ): string {
    return `You encounter this information online. How should you respond?\n\n"${result.content.substring(0, 200)}..."\n\nWhat is the best course of action?`;
  }

  private generateScenarioOptions(
    result: VerificationResult,
    userProfile: UserProfile
  ): string[] {
    return [
      'Share immediately with friends',
      'Verify from multiple reliable sources first',
      'Ignore the information',
      'Ask social media followers for their opinion'
    ];
  }

  private getScenarioCorrectAnswer(result: VerificationResult): string {
    return 'Verify from multiple reliable sources first';
  }

  private generateExplanation(
    result: VerificationResult,
    userProfile: UserProfile
  ): string {
    const level = userProfile.literacyLevel;
    
    if (level === LiteracyLevel.BEGINNER) {
      return `This information was verified as ${result.verdict}. Always check facts before sharing!`;
    } else if (level === LiteracyLevel.INTERMEDIATE) {
      return `The verification process determined this information is ${result.verdict} with ${result.confidence}% confidence. This demonstrates the importance of fact-checking.`;
    } else {
      return `Comprehensive analysis resulted in a ${result.verdict} verdict with ${result.confidence}% confidence. This case illustrates key principles in information verification and critical thinking.`;
    }
  }

  private generateQuizTitle(results: VerificationResult[], userProfile: UserProfile): string {
    const category = this.determinePrimaryCategory(results);
    const level = userProfile.literacyLevel;
    
    if (level === LiteracyLevel.BEGINNER) {
      return `Quick Quiz: ${category} Information`;
    } else if (level === LiteracyLevel.INTERMEDIATE) {
      return `Verification Challenge: ${category} Content`;
    } else {
      return `Advanced Analysis Quiz: ${category} Misinformation Patterns`;
    }
  }

  private generateQuizDescription(
    results: VerificationResult[],
    userProfile: UserProfile
  ): string {
    const count = results.length;
    const level = userProfile.literacyLevel;
    
    if (level === LiteracyLevel.BEGINNER) {
      return `Test your knowledge with ${count} simple questions about information verification.`;
    } else if (level === LiteracyLevel.INTERMEDIATE) {
      return `Challenge yourself with ${count} questions that test your ability to identify and analyze misinformation.`;
    } else {
      return `Advanced quiz with ${count} complex scenarios testing your critical thinking and verification skills.`;
    }
  }

  private determinePrimaryCategory(results: VerificationResult[]): MisinformationCategory {
    const categories = results.map(r => r.category);
    const categoryCounts = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0][0] as MisinformationCategory;
  }

  private calculateTimeLimit(questions: QuizQuestion[], userProfile: UserProfile): number {
    const baseTime = questions.length * 30; // 30 seconds per question
    const levelMultiplier = userProfile.literacyLevel === LiteracyLevel.BEGINNER ? 1.5 : 1;
    return Math.ceil(baseTime * levelMultiplier);
  }

  private calculatePassingScore(userProfile: UserProfile): number {
    switch (userProfile.literacyLevel) {
      case LiteracyLevel.BEGINNER:
        return 60;
      case LiteracyLevel.INTERMEDIATE:
        return 70;
      case LiteracyLevel.ADVANCED:
        return 80;
      default:
        return 70;
    }
  }

  private calculateQuestionPoints(result: VerificationResult, userProfile: UserProfile): number {
    const basePoints = 10;
    const difficultyMultiplier = userProfile.literacyLevel === LiteracyLevel.ADVANCED ? 1.5 : 1;
    return Math.ceil(basePoints * difficultyMultiplier);
  }

  private calculateQuizTime(questions: QuizQuestion[]): number {
    return Math.ceil(questions.length * 2); // 2 minutes per question
  }

  private extractQuizTags(results: VerificationResult[]): string[] {
    const tags = new Set<string>();
    results.forEach(result => {
      tags.add(result.category);
      tags.add(result.verdict);
    });
    return Array.from(tags);
  }

  private initializeTemplates(): void {
    // HTML quiz template
    this.addQuizTemplate('html', LiteracyLevel.INTERMEDIATE, `
      <div class="quiz-container" data-quiz-id="{{quiz.id}}">
        <header class="quiz-header">
          <h2>{{quiz.title}}</h2>
          <p class="quiz-description">{{quiz.description}}</p>
          <div class="quiz-meta">
            <span class="difficulty">{{quiz.difficulty}}</span>
            <span class="category">{{quiz.category}}</span>
            {{#if quiz.timeLimit}}
            <span class="time-limit">Time: {{quiz.timeLimit}}s</span>
            {{/if}}
          </div>
        </header>

        <div class="quiz-progress">
          <div class="progress-bar">
            <div class="progress" style="width: 0%"></div>
          </div>
          <span class="progress-text">Question 1 of {{quiz.questions.length}}</span>
        </div>

        <form class="quiz-form">
          {{#each quiz.questions}}
          <div class="question-container" data-question-id="{{this.id}}" style="display: none;">
            <div class="question-header">
              <h3>Question {{@index}}</h3>
              <span class="points">{{this.points}} points</span>
            </div>
            
            <div class="question-content">
              <p class="question-text">{{this.question}}</p>
              
              {{#if this.options}}
              <div class="options">
                {{#each this.options}}
                <label class="option">
                  <input type="radio" name="question_{{../id}}" value="{{this}}">
                  <span class="option-text">{{this}}</span>
                </label>
                {{/each}}
              </div>
              {{/if}}
            </div>

            <div class="question-actions">
              <button type="button" class="btn-next" {{#unless @last}}style="display: none;"{{/unless}}>
                {{#if @last}}Submit Quiz{{else}}Next Question{{/if}}
              </button>
            </div>
          </div>
          {{/each}}
        </form>

        <div class="quiz-results" style="display: none;">
          <h3>Quiz Results</h3>
          <div class="score-display">
            <span class="score">0</span>/<span class="total">{{quiz.questions.length}}</span>
          </div>
          <div class="feedback"></div>
        </div>
      </div>

      <style>
        .quiz-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .quiz-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .quiz-meta {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 10px;
        }
        
        .quiz-meta span {
          padding: 5px 10px;
          background: #f0f0f0;
          border-radius: 15px;
          font-size: 0.9em;
        }
        
        .quiz-progress {
          margin-bottom: 30px;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress {
          height: 100%;
          background: #4CAF50;
          transition: width 0.3s ease;
        }
        
        .question-container {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .points {
          background: #2196F3;
          color: white;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 0.9em;
        }
        
        .options {
          margin: 20px 0;
        }
        
        .option {
          display: block;
          margin: 10px 0;
          padding: 10px;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .option:hover {
          border-color: #2196F3;
        }
        
        .option input[type="radio"] {
          margin-right: 10px;
        }
        
        .btn-next {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1em;
        }
        
        .btn-next:hover {
          background: #45a049;
        }
      </style>
    `);
  }

  private addQuizTemplate(
    format: string,
    level: LiteracyLevel,
    templateString: string
  ): void {
    const key = `${format}_${level}`;
    const template = Handlebars.compile(templateString);
    this.quizTemplates.set(key, template);
  }

  private getQuizTemplate(format: string, level: LiteracyLevel): HandlebarsTemplateDelegate {
    const key = `${format}_${level}`;
    const template = this.quizTemplates.get(key);
    
    if (!template) {
      throw new Error(`Quiz template not found: ${key}`);
    }
    
    return template;
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Additional interfaces for quiz generation
export interface QuizGenerationOptions {
  questionCount?: number;
  includeScenarios?: boolean;
  focusAreas?: string[];
}

export interface AdaptiveQuizOptions {
  questionCount?: number;
  difficultyAdjustment?: number;
  focusWeakAreas?: boolean;
}

export interface MisinformationScenario {
  id: string;
  description: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category: MisinformationCategory;
  difficulty: LiteracyLevel;
}