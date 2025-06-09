import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import smartIcon from "../assets/Smart.png";
import onPointIcon from "../assets/On-Point.png";
import trackIcon from "../assets/Task.png";
import resIcon from "../assets/Bar-Chart.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const Features: React.FC = () => {
  const features = [
    {
      icon: smartIcon,
      title: "AI-Powered Interview Simulation",
      description: "Experience realistic interview scenarios tailored to your industry.",
      problem: "Traditional mock interviews lack real-time interaction and industry-specific context.",
      solution: "Our AI interviewer adapts to your responses, creating dynamic conversations that mirror real interviews.",
      benefits: [
        "Natural conversation flow",
        "Industry-specific scenarios",
        "Real-time response adaptation",
        "Behavioral and technical questions"
      ]
    },
    {
      icon: onPointIcon,
      title: "Real-Time Performance Analysis",
      description: "Get instant feedback on your communication style and responses.",
      problem: "Most interview feedback comes too late and lacks specific improvement areas.",
      solution: "Our AI analyzes your responses in real-time, providing immediate feedback on communication, content, and delivery.",
      benefits: [
        "Communication style analysis",
        "Response quality metrics",
        "Body language insights",
        "Confidence level assessment"
      ]
    },
    {
      icon: trackIcon,
      title: "Personalized Learning Path",
      description: "Track your progress and focus on areas that need improvement.",
      problem: "Generic interview preparation doesn't address individual weaknesses.",
      solution: "Our system creates a customized learning path based on your performance patterns and career goals.",
      benefits: [
        "Skill gap analysis",
        "Customized practice sessions",
        "Progress milestones",
        "Weakness targeting"
      ]
    },
    {
      icon: resIcon,
      title: "Comprehensive Analytics Dashboard",
      description: "Visualize your interview performance and improvement over time.",
      problem: "Candidates struggle to understand their interview performance patterns.",
      solution: "Our analytics dashboard provides detailed insights into your interview performance, highlighting strengths and areas for improvement.",
      benefits: [
        "Performance trends",
        "Response time analysis",
        "Success rate tracking",
        "Improvement recommendations"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-grow">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-bold text-center mb-6"
            >
              Master Your Interview Skills
            </motion.h1>
            <motion.p 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-center max-w-3xl mx-auto"
            >
              Experience the future of interview preparation with our AI-powered platform
            </motion.p>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-16"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="md:flex">
                  {/* Left side - Icon and Title */}
                  <div className="md:w-1/3 bg-purple-50 p-8 flex flex-col items-center justify-center">
                    <img 
                      src={feature.icon} 
                      alt={feature.title} 
                      className="w-32 h-32 mb-6"
                    />
                    <h3 className="text-2xl font-bold text-purple-600 text-center">
                      {feature.title}
                    </h3>
                  </div>

                  {/* Right side - Content */}
                  <div className="md:w-2/3 p-8">
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">The Challenge</h4>
                      <p className="text-gray-600">{feature.problem}</p>
                    </div>

                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">How We Solve It</h4>
                      <p className="text-gray-600">{feature.solution}</p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">What You Get</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {feature.benefits.map((benefit) => (
                          <div 
                            key={benefit}
                            className="flex items-center space-x-2 text-gray-600"
                          >
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Call to Action */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mt-20 text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Transform Your Interview Skills?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers who have already improved their interview performance with ClickView's AI-powered platform.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              Start Your Free Trial
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Features; 