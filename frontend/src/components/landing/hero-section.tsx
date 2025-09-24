"use client"

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary to-accent rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Column - Content */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Badge */}
            <motion.div
              variants={staggerItem}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-8 backdrop-blur-sm"
            >
              ✨ Professional AI Image Generation
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={staggerItem}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance leading-tight"
            >
              Transform Ideas into{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Visual Reality
                </span>
                <motion.div
                  className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-white/60 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                />
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={staggerItem}
              className="text-lg md:text-xl text-white/80 mb-10 max-w-xl text-balance"
            >
              Create stunning, professional-quality images from simple text descriptions using cutting-edge AI technology. Perfect for designers, artists, and content creators.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={staggerItem}
              className="flex flex-col sm:flex-row gap-4 items-start"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-white text-black hover:bg-white/90 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 group">
                  Start Creating Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  className="bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 group backdrop-blur-sm"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              variants={staggerItem}
              className="mt-12 text-white/60 text-sm"
            >
              <p className="mb-4">Trusted by 50,000+ creators worldwide</p>
              <div className="flex items-center space-x-8 opacity-80">
                <div className="text-xs font-medium">⭐⭐⭐⭐⭐</div>
                <div className="text-xs">4.9/5 rating</div>
                <div className="text-xs">No credit card required</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="relative"
          >
            <div className="relative">
              <motion.div
                className="w-full h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-center"
                whileHover={{ scale: 1.02, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center text-white/60">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className="text-lg">Artifex AI Dashboard Preview</p>
                </div>
              </motion.div>
              
              {/* Floating UI Elements */}
              <motion.div
                className="absolute -top-4 -right-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-white text-sm"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                ✨ Generated in 2.3s
              </motion.div>
              
              <motion.div
                className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-white text-sm"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                🎨 4K Resolution
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div className="w-1 h-3 bg-white/60 rounded-full mt-2" />
        </motion.div>
      </motion.div>
    </section>
  )
}