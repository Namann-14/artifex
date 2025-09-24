"use client"

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Edit3, Cpu, Download } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

const steps = [
  {
    step: '01',
    icon: Edit3,
    title: 'Describe Your Vision',
    description: 'Simply type what you want to create. Be as detailed or as simple as you like.',
    example: '"A majestic sunset over a mountain lake with autumn colors"'
  },
  {
    step: '02',
    icon: Cpu,
    title: 'AI Works Its Magic',
    description: 'Our advanced AI processes your prompt and generates your unique image in seconds.',
    example: 'Processing with state-of-the-art neural networks'
  },
  {
    step: '03',
    icon: Download,
    title: 'Download & Use',
    description: 'Get your high-quality image ready for any project, commercial or personal.',
    example: 'Multiple formats: PNG, JPG, WebP'
  }
]

export function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mb-16"
        >
          <motion.div variants={staggerItem} className="flex justify-center mb-4">
            <Badge variant="outline" className="px-4 py-2">
              Simple Process
            </Badge>
          </motion.div>
          
          <motion.h2 
            variants={staggerItem}
            className="text-3xl md:text-5xl font-bold mb-6 text-balance"
          >
            Create Amazing Images in{' '}
            <span className="gradient-text">Three Simple Steps</span>
          </motion.h2>
          
          <motion.p 
            variants={staggerItem}
            className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance"
          >
            Our streamlined process makes it easy for anyone to create professional-quality images
          </motion.p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                variants={staggerItem}
                className="relative"
              >
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="hidden lg:block absolute top-20 left-full w-12 h-0.5 bg-gradient-to-r from-primary to-muted-foreground/20 z-10"
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{ delay: index * 0.2 + 0.8, duration: 0.6 }}
                  />
                )}

                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="feature-card text-center h-full group cursor-pointer">
                    {/* Step Number */}
                    <motion.div
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-6 group-hover:scale-110 transition-transform"
                      whileHover={{ rotate: 10 }}
                    >
                      {step.step}
                    </motion.div>

                    {/* Icon */}
                    <motion.div
                      className="flex justify-center mb-4"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <step.icon className="h-8 w-8 text-primary" />
                      </div>
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {step.description}
                    </p>
                    
                    {/* Example */}
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground italic">
                        {step.example}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mt-16"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button className="btn-hero-primary">
              Try It Now - It's Free!
            </button>
          </motion.div>
          <p className="text-sm text-muted-foreground mt-3">
            No signup required • Generate 3 images free
          </p>
        </motion.div>
      </div>
    </section>
  )
}