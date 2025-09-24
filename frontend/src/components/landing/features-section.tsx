"use client"

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Wand2, 
  Image, 
  Crown, 
  Zap, 
  Palette, 
  Download,
  Sparkles,
  Clock
} from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

const features = [
  {
    icon: Wand2,
    title: 'Text-to-Image Generation',
    description: 'Transform your creative ideas into stunning visuals with just a simple text description.',
    badge: 'Most Popular'
  },
  {
    icon: Image,
    title: 'Image-to-Image Enhancement',
    description: 'Upload existing images and transform them with AI precision and artistic flair.',
    badge: 'Pro Feature'
  },
  {
    icon: Crown,
    title: 'Professional Quality',
    description: 'Generate high-resolution images up to 4K quality suitable for any professional project.',
    badge: 'Premium'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Create stunning images in seconds, not hours. Our optimized AI delivers rapid results.',
    badge: 'Speed'
  },
  {
    icon: Palette,
    title: 'Multiple Art Styles',
    description: 'Choose from photorealistic, artistic, cartoon, and many other creative styles.',
    badge: 'Creative'
  },
  {
    icon: Download,
    title: 'Easy Export',
    description: 'Download your creations in multiple formats including PNG, JPG, and SVG.',
    badge: 'Flexible'
  }
]

export function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mb-16"
        >
          <motion.div variants={staggerItem} className="flex justify-center mb-4">
            <Badge variant="outline" className="px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Powerful Features
            </Badge>
          </motion.div>
          
          <motion.h2 
            variants={staggerItem}
            className="text-3xl md:text-5xl font-bold mb-6 text-balance"
          >
            Everything You Need to{' '}
            <span className="gradient-text">Create Amazing</span> Images
          </motion.h2>
          
          <motion.p 
            variants={staggerItem}
            className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance"
          >
            Our advanced AI technology provides all the tools you need to bring your creative vision to life
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={staggerItem}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="feature-card h-full group cursor-pointer">
                <div className="flex items-start space-x-4">
                  <motion.div
                    className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <feature.icon className="h-6 w-6 text-primary" />
                  </motion.div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{feature.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { number: '2M+', label: 'Images Generated' },
            { number: '50K+', label: 'Happy Users' },
            { number: '99.9%', label: 'Uptime' },
            { number: '<3s', label: 'Average Generation Time' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={staggerItem}
              className="text-center"
            >
              <motion.div
                className="text-2xl md:text-3xl font-bold text-primary mb-2"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
              >
                {stat.number}
              </motion.div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}