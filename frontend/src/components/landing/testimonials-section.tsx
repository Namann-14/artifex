"use client"

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Star, Quote } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/animations'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Digital Artist',
    company: 'Creative Studio',
    content: 'Artifex AI has completely transformed my creative workflow. The quality and speed of image generation is absolutely incredible. I can now bring my wildest ideas to life in seconds.',
    rating: 5,
    avatar: 'SC'
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Marketing Director',
    company: 'TechCorp Inc.',
    content: 'We use Artifex AI for all our marketing campaigns now. The professional quality images and variety of styles have elevated our brand presence significantly.',
    rating: 5,
    avatar: 'MR'
  },
  {
    name: 'Emily Foster',
    role: 'Freelance Designer',
    company: 'Independent',
    content: 'As a freelancer, Artifex AI has been a game-changer. I can deliver high-quality visuals to my clients faster than ever before, which means more projects and better profits.',
    rating: 5,
    avatar: 'EF'
  },
  {
    name: 'David Park',
    role: 'Creative Director',
    company: 'Design Agency',
    content: 'The AI understands creative intent better than any tool I\'ve used. It\'s like having a creative partner that never runs out of ideas.',
    rating: 5,
    avatar: 'DP'
  },
  {
    name: 'Lisa Thompson',
    role: 'Content Creator',
    company: 'YouTube',
    content: 'I create thumbnails and graphics for my channel using Artifex AI. The results are always stunning and help my content stand out.',
    rating: 5,
    avatar: 'LT'
  },
  {
    name: 'Alex Kumar',
    role: 'Product Manager',
    company: 'StartupXYZ',
    content: 'Our team relies on Artifex AI for rapid prototyping and concept visualization. It\'s incredibly intuitive and produces professional results every time.',
    rating: 5,
    avatar: 'AK'
  }
]

export function TestimonialsSection() {
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
              <Star className="w-4 h-4 mr-2 fill-current" />
              Customer Reviews
            </Badge>
          </motion.div>
          
          <motion.h2 
            variants={staggerItem}
            className="text-3xl md:text-5xl font-bold mb-6 text-balance"
          >
            What Our <span className="gradient-text">Creators Say</span>
          </motion.h2>
          
          <motion.p 
            variants={staggerItem}
            className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance"
          >
            Join thousands of satisfied creators who have transformed their creative process with Artifex AI
          </motion.p>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16"
        >
          {[
            { number: '4.9/5', label: 'Average Rating', icon: '⭐' },
            { number: '50K+', label: 'Happy Users', icon: '👥' },
            { number: '2M+', label: 'Images Created', icon: '🎨' },
            { number: '99%', label: 'Satisfaction Rate', icon: '💯' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={staggerItem}
              className="text-center"
            >
              <motion.div
                className="text-3xl mb-2"
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: index * 0.1 + 0.5, type: "spring", stiffness: 200 }}
              >
                {stat.icon}
              </motion.div>
              <motion.div
                className="text-2xl font-bold text-primary mb-1"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: index * 0.1 + 0.7 }}
              >
                {stat.number}
              </motion.div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              variants={staggerItem}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="feature-card h-full group cursor-pointer">
                {/* Quote Icon */}
                <motion.div
                  className="flex justify-between items-start mb-4"
                  whileHover={{ scale: 1.05 }}
                >
                  <Quote className="h-6 w-6 text-primary/60" />
                  <div className="flex text-yellow-400">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </motion.div>

                {/* Content */}
                <blockquote className="text-foreground/90 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center space-x-3">
                  <motion.div whileHover={{ scale: 1.1 }}>
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Social Proof */}
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-4">Trusted by creators at</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-sm font-medium">Adobe</div>
            <div className="text-sm font-medium">Behance</div>
            <div className="text-sm font-medium">Dribbble</div>
            <div className="text-sm font-medium">Pinterest</div>
            <div className="text-sm font-medium">Instagram</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}