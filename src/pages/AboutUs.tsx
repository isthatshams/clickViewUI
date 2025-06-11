import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import mohammadImage from '../assets/members/Mohammad Shams.jpg';
import helmiImage from '../assets/members/Helmi Nofal.jpg';
import nadaImage from '../assets/members/Nada.jpg';
import omarImage from '../assets/members/Omar.jpg';

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

const AboutUs: React.FC = () => {
  const teamMembers = [
    {
      name: "Mohammad Shams",
      role: "Team Leader, Back-End Developer, AI Developer, Project Manager",
      description: "Leads the team, manages backend architecture, and oversees AI development and project direction.",
      image: mohammadImage,
      skills: ["Leadership", "AI Development", "Backend Architecture", "Project Management"]
    },
    {
      name: "Helmi Nofal",
      role: "Front-End Developer, UI/UX Designer, Integration Lead",
      description: "Builds the front-end interface, crafts user experience, and integrates the front and back ends.",
      image: helmiImage,
      skills: ["React", "UI/UX Design", "Frontend Development", "API Integration"]
    },
    {
      name: "Nada Barahmieh",
      role: "Front-End Developer, UI/UX Designer, Co-Project Manager",
      description: "Designs the user interface, supports front-end development, and co-manages project responsibilities.",
      image: nadaImage,
      skills: ["UI Design", "Frontend Development", "Project Management", "User Experience"]
    },
    {
      name: "Omar Al Qaissieh",
      role: "AI Developer, Prompt Engineer",
      description: "Focuses on AI prompt engineering and contributes to building the app's intelligent features.",
      image: omarImage,
      skills: ["AI Development", "Prompt Engineering", "Machine Learning", "Natural Language Processing"]
    }
  ];

  const stats = [
    { number: "10K+", label: "Active Users" },
    { number: "95%", label: "Success Rate" },
    { number: "50+", label: "Industries" },
    { number: "24/7", label: "Support" }
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
              About Us
            </motion.h1>
            <motion.p 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-center max-w-3xl mx-auto"
            >
              We're on a mission to revolutionize the interview preparation experience
            </motion.p>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:-translate-y-1 transition-all duration-300"
              >
                <div className="text-3xl font-bold text-purple-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* About the App Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl font-semibold text-purple-600 mb-6"
            >
              About the App
            </motion.h2>
            <motion.div 
              variants={fadeInUp}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <p className="text-lg text-gray-700 leading-relaxed">
                Job seekers around the world face immense challenges during job interviews — especially during the questioning phase. 
                Many candidates experience anxiety, stress, and a sense of being overwhelmed. In their effort to make a strong impression, 
                they often struggle with unpredictable and abstract questions that may not truly reflect their capabilities or the preparation 
                they've put in. This is particularly true in large organizations, where interviews are often conducted in a rigid, impersonal 
                format that focuses more on stress-handling than relevant skills. As a result, job seekers are left frustrated, unprepared, 
                and unsure about what specific competencies are being evaluated.
              </p>
            </motion.div>
          </motion.section>

          {/* Team Section */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl font-semibold text-purple-600 mb-8 text-center"
            >
              Meet the Team
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.name}
                  variants={fadeInUp}
                  className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-purple-100">
                    {member.image ? (
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-bold">
                        {member.name.split(' ')[0][0]}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <h4 className="text-sm text-center text-purple-600 italic mb-4">
                    {member.role}
                  </h4>
                  <p className="text-gray-600 text-center mb-4">
                    {member.description}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {member.skills.map((skill) => (
                      <span 
                        key={skill}
                        className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Mission Statement */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="py-20 bg-gradient-to-br from-purple-50 to-white rounded-3xl my-16"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                variants={fadeInUp}
                className="text-center mb-12"
              >
                <motion.h2 
                  variants={fadeInUp}
                  className="text-4xl font-bold text-purple-600 mb-6"
                >
                  Our Mission
                </motion.h2>
                <motion.div 
                  variants={fadeInUp}
                  className="w-24 h-1 bg-purple-600 mx-auto mb-8"
                />
                <motion.p 
                  variants={fadeInUp}
                  className="text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed"
                >
                  To empower job seekers with confidence and preparation through innovative AI-driven interview practice, 
                  making the job search process more accessible and successful for everyone.
                </motion.p>
              </motion.div>

              <motion.div 
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
              >
                {[
                  {
                    title: "Innovation",
                    description: "Leveraging cutting-edge AI technology to provide personalized interview preparation",
                    icon: "🚀"
                  },
                  {
                    title: "Accessibility",
                    description: "Making professional interview preparation available to everyone, anywhere, anytime",
                    icon: "🌍"
                  },
                  {
                    title: "Success",
                    description: "Helping candidates achieve their career goals through effective preparation",
                    icon: "🎯"
                  }
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    variants={fadeInUp}
                    className="bg-white p-8 rounded-2xl shadow-lg transform hover:-translate-y-2 transition-all duration-300"
                  >
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <h3 className="text-xl font-bold text-purple-600 mb-3">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="mt-16 text-center"
              >
                <motion.h3 
                  variants={fadeInUp}
                  className="text-2xl font-semibold text-gray-800 mb-6"
                >
                  Join Us in Our Journey
                </motion.h3>
                <motion.p 
                  variants={fadeInUp}
                  className="text-lg text-gray-600 max-w-2xl mx-auto mb-8"
                >
                  Together, we're building a future where every job seeker has the tools and confidence to succeed in their interviews.
                </motion.p>
                <motion.button
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors duration-300 shadow-lg hover:shadow-xl"
                >
                  Get Started Today
                </motion.button>
              </motion.div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default AboutUs; 