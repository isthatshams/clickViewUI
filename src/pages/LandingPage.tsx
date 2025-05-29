import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import heroImage from "../assets/Landing_page_image.png";
import smartIcon from "../assets/Smart.png";
import onPointIcon from "../assets/On-Point.png";
import trackIcon from "../assets/Task.png";
import resIcon from "../assets/Bar-Chart.png";
import { useState } from 'react';

export default function ClickViewLanding() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      text: "ClickView's feedback is precise and helps me improve fast, making me feel much more confident in interviews.",
      author: "Sarah James",
      role: "Marketing Manager",
      company: "TechCorp",
      rating: 5
    },
    {
      text: "I've never felt more confident in an interview. The tailored questions and progress tracking keep me on the right track.",
      author: "Michael Lee",
      role: "Software Developer",
      company: "InnovateSoft",
      rating: 5
    },
    {
      text: "This app has changed the way I approach interviews. The AI-driven feedback is incredibly accurate and easy to follow.",
      author: "Jessica Roberts",
      role: "HR Specialist",
      company: "GlobalHR",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 gap-6 md:gap-10">
          <div className="max-w-md flex flex-col justify-between md:mr-20">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Ace Every <br/>Interview with <br/>ClickView
            </h1>
            <p className="w-full text-gray-900 text-sm my-4">
              your AI-powered personal interviewer <br/>
              practice, improve, and land your dream<br/> job with confidence.
            </p>
            
            {/* Stats Section */}
            <div className="flex gap-6 mb-6">
              <div>
                <p className="text-2xl font-bold text-purple-600">10K+</p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">95%</p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">50+</p>
                <p className="text-sm text-gray-600">Industries</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                className="px-6 py-2.5 rounded-md cursor-pointer w-full md:w-auto bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Start Practicing Free
              </Button>
              <button className="px-6 py-2.5 rounded-md text-sm font-medium border-2 border-black bg-white text-black hover:bg-gray-50 transition-colors w-full md:w-auto">
                Watch a Demo
              </button>
            </div>
          </div>

          <div className="flex justify-center items-center w-full md:w-auto">
            <img 
              src={heroImage} 
              alt="hero illustration" 
              className="w-full max-w-md animate-float"
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section className="text-center my-3 py-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-purple-600 mb-2">
            How It Works
          </h2>
          <p className="text-gray-600 mb-12">Master your interview skills in three simple steps</p>
        
          <div className="grid md:grid-cols-2 gap-10 mt-12 text-left">
            {[
              {
                icon: smartIcon,
                title: "Smart Questions Generator",
                description: "Train with tailored questions based on your industry and experience. Whether you're speaking or typing, the AI adapts to your level in real time."
              },
              {
                icon: onPointIcon,
                title: "On-point Feedback",
                description: "After every voice or text interview, get an instant breakdown of your performance — from response accuracy to timing."
              },
              {
                icon: trackIcon,
                title: "Track Your Progress",
                description: "Review your past interviews and track your progress over time. See what you've improved on and what needs more focus."
              },
              {
                icon: resIcon,
                title: "See Your Results",
                description: "Review your past interviews and track your growth over time. See where you've improved and what to focus on next — all in one place."
              }
            ].map((feature, index) => (
              <div key={index} className="flex gap-4 items-start p-6 rounded-lg hover:bg-purple-50 transition-all duration-300 cursor-pointer group">
                <img src={feature.icon} alt={feature.title} className="w-20 h-20 group-hover:scale-110 transition-transform duration-300"/>
                <div>
                  <h3 className="font-bold mb-3 text-purple-600 group-hover:text-purple-700">
                    {feature.title}
                  </h3>
                  <p className="text-gray-900 text-sm">
                    {feature.description}
                  </p>
                  <a href="#" className="text-purple-600 text-sm mt-2 inline-block hover:text-purple-700">
                    Learn More →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 px-6 bg-purple-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-purple-600 mb-12">
              What Our Users Say
            </h2>
            
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={index}
                    className={`bg-white p-6 rounded-lg shadow-lg transition-all duration-300 ${
                      activeTestimonial === index ? 'scale-105' : 'scale-100'
                    }`}
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                        {testimonial.author[0]}
                      </div>
                      <div className="ml-4">
                        <p className="font-bold">{testimonial.author}</p>
                        <p className="text-sm text-gray-600">{testimonial.role} at {testimonial.company}</p>
                      </div>
                    </div>
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400">★</span>
                      ))}
                    </div>
                    <p className="text-gray-700">{testimonial.text}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center mt-8 gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      activeTestimonial === index ? 'bg-purple-600' : 'bg-purple-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-purple-600 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                question: "How does ClickView work?",
                answer: "ClickView uses advanced AI to simulate real interview scenarios, providing personalized feedback and improvement suggestions."
              },
              {
                question: "Is it really free to start?",
                answer: "Yes! We offer a free trial with full access to our basic features. No credit card required."
              },
              {
                question: "What types of interviews can I practice?",
                answer: "We cover various interview types including behavioral, technical, case study, and general interviews across multiple industries."
              },
              {
                question: "How accurate is the AI feedback?",
                answer: "Our AI has been trained on thousands of successful interviews and provides feedback comparable to human interviewers."
              }
            ].map((faq, index) => (
              <div key={index} className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <h3 className="font-bold text-lg mb-2 text-gray-900">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="text-center py-16 bg-purple-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-purple-600">
              Ready to impress your next interviewer?
            </h2>
            <p className="mb-8 text-gray-900">
              Join thousands already using ClickView to practice <br/> smarter and interview better.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <Button 
                className="px-6 py-3 rounded-md cursor-pointer bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300"
              >
                Start Your Free Mock Interview
              </Button>
              <p className="text-sm text-gray-600">No credit card required</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
} 