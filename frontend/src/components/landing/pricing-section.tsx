"use client"

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Crown, Zap, Star } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/animations'

const plans = [
  {
    name: 'Free',
    icon: Zap,
    price: 0,
    period: 'forever',
    description: 'Perfect for trying out Artifex AI',
    badge: 'Get Started',
    features: [
      '3 image generations per day',
      'Standard resolution (1024x1024)',
      'Basic art styles',
      'Community gallery access',
      'Email support'
    ],
    cta: 'Start Free',
    popular: false
  },
  {
    name: 'Pro',
    icon: Crown,
    price: 19,
    period: 'month',
    description: 'For creators and professionals',
    badge: 'Most Popular',
    features: [
      '500 image generations per month',
      'High resolution (up to 2048x2048)',
      'All art styles and filters',
      'Commercial license included',
      'Priority support',
      'API access',
      'Batch generation',
      'Custom style training'
    ],
    cta: 'Go Pro',
    popular: true
  },
  {
    name: 'Enterprise',
    icon: Star,
    price: 99,
    period: 'month',
    description: 'For teams and organizations',
    badge: 'Advanced',
    features: [
      'Unlimited image generations',
      'Ultra-high resolution (up to 4096x4096)',
      'White-label solution',
      'Team collaboration tools',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'Advanced analytics'
    ],
    cta: 'Contact Sales',
    popular: false
  }
]

export function PricingSection() {
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
              Simple Pricing
            </Badge>
          </motion.div>
          
          <motion.h2 
            variants={staggerItem}
            className="text-3xl md:text-5xl font-bold mb-6 text-balance"
          >
            Choose Your <span className="gradient-text">Creative Plan</span>
          </motion.h2>
          
          <motion.p 
            variants={staggerItem}
            className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance"
          >
            Start free and upgrade as your creative needs grow. All plans include our core AI technology.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              variants={staggerItem}
              whileHover={{ y: -8, scale: plan.popular ? 1.02 : 1.01 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {plan.popular && (
                <motion.div
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    {plan.badge}
                  </Badge>
                </motion.div>
              )}

              <Card className={`feature-card h-full ${plan.popular ? 'ring-2 ring-primary' : ''} group cursor-pointer`}>
                <div className="text-center">
                  {/* Icon */}
                  <motion.div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 group-hover:scale-110 transition-transform ${
                      plan.popular ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    }`}
                    whileHover={{ rotate: 10 }}
                  >
                    <plan.icon className="h-8 w-8" />
                  </motion.div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  
                  {/* Badge */}
                  {!plan.popular && (
                    <Badge variant="outline" className="mb-4">
                      {plan.badge}
                    </Badge>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground ml-1">/{plan.period}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground mb-8">{plan.description}</p>

                  {/* CTA Button */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mb-8"
                  >
                    <Button 
                      className={`w-full ${plan.popular ? 'btn-hero-primary' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </motion.div>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      className="flex items-start space-x-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 + featureIndex * 0.05 + 0.8 }}
                    >
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="mt-16 text-center"
        >
          <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-sm text-muted-foreground">💳 Secure Payment</div>
              <div className="text-xs text-muted-foreground mt-1">256-bit SSL encryption</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">↩️ 30-Day Refund</div>
              <div className="text-xs text-muted-foreground mt-1">No questions asked</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">🔄 Cancel Anytime</div>
              <div className="text-xs text-muted-foreground mt-1">No long-term contracts</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}