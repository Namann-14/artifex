"use client"

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

export function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Icon */}
          <motion.div
            variants={staggerItem}
            className="flex justify-center mb-6"
          >
            <motion.div
              className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm"
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ duration: 0.3 }}
            >
              <Sparkles className="h-8 w-8 text-white" />
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.h2 
            variants={staggerItem}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance leading-tight"
          >
            Ready to Create Something{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Amazing?
              </span>
              <motion.div
                className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-white/60 to-transparent"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              />
            </span>
          </motion.h2>

          {/* Description */}
          <motion.p
            variants={staggerItem}
            className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto text-balance"
          >
            Join thousands of creators who are already transforming their ideas into stunning visuals with Artifex AI. Start your creative journey today.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={staggerItem}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-white text-black hover:bg-white/90 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 group">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                className="bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm"
              >
                View Pricing
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={staggerItem}
            className="text-white/60 text-sm"
          >
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8">
              <div className="flex items-center">
                <span className="text-white/80">✓</span>
                <span className="ml-2">No credit card required</span>
              </div>
              <div className="flex items-center">
                <span className="text-white/80">✓</span>
                <span className="ml-2">3 free images daily</span>
              </div>
              <div className="flex items-center">
                <span className="text-white/80">✓</span>
                <span className="ml-2">Cancel anytime</span>
              </div>
            </div>
          </motion.div>

          {/* Success Stats */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-80"
          >
            {[
              { number: '2M+', label: 'Images Created' },
              { number: '50K+', label: 'Active Users' },
              { number: '4.9★', label: 'User Rating' },
              { number: '99.9%', label: 'Uptime' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={staggerItem}
                className="text-center"
              >
                <motion.div
                  className="text-xl md:text-2xl font-bold text-white mb-1"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                  transition={{ delay: index * 0.1 + 1, duration: 0.5 }}
                >
                  {stat.number}
                </motion.div>
                <p className="text-xs text-white/60">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 left-10 w-4 h-4 bg-white/20 rounded-full"
        animate={{
          y: [0, -20, 0],
          opacity: [0.2, 0.8, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-32 right-16 w-6 h-6 bg-white/30 rounded-full"
        animate={{
          y: [0, -30, 0],
          opacity: [0.3, 0.9, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
    </section>
  )
}