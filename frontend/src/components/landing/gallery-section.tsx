"use client"

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Heart, Download } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/animations'

const categories = ['All', 'Art', 'Photography', 'Design', 'Illustrations']

const galleryItems = [
  {
    id: 1,
    category: 'Art',
    title: 'Digital Masterpiece',
    prompt: 'Abstract digital art with vibrant colors',
    likes: 234,
    views: 1200,
  },
  {
    id: 2,
    category: 'Photography',
    title: 'Mountain Landscape',
    prompt: 'Majestic mountain sunset with reflection',
    likes: 189,
    views: 890,
  },
  {
    id: 3,
    category: 'Design',
    title: 'Modern Architecture',
    prompt: 'Futuristic building with glass facade',
    likes: 156,
    views: 750,
  },
  {
    id: 4,
    category: 'Illustrations',
    title: 'Fantasy Character',
    prompt: 'Mystical warrior in enchanted forest',
    likes: 298,
    views: 1450,
  },
  {
    id: 5,
    category: 'Art',
    title: 'Abstract Expression',
    prompt: 'Flowing colors and dynamic shapes',
    likes: 167,
    views: 820,
  },
  {
    id: 6,
    category: 'Photography',
    title: 'Urban Night',
    prompt: 'City lights reflecting on wet streets',
    likes: 245,
    views: 1100,
  }
]

export function GallerySection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeCategory, setActiveCategory] = useState('All')

  const filteredItems = activeCategory === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory)

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
              Inspiration Gallery
            </Badge>
          </motion.div>
          
          <motion.h2 
            variants={staggerItem}
            className="text-3xl md:text-5xl font-bold mb-6 text-balance"
          >
            See What&apos;s <span className="gradient-text">Possible</span>
          </motion.h2>
          
          <motion.p 
            variants={staggerItem}
            className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance"
          >
            Explore stunning creations from our community of artists and creators
          </motion.p>
        </motion.div>

        {/* Featured Gallery Showcase */}
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="mb-16"
        >
          <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
            <motion.div
              className="w-full h-[500px] bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center text-gray-600">
                <div className="text-6xl mb-4">🖼️</div>
                <p className="text-lg">Gallery Showcase</p>
              </div>
            </motion.div>
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
              <div className="text-center text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Professional AI Artwork Gallery</h3>
                <p className="text-lg mb-6">Discover the endless possibilities of AI-generated art</p>
                <Button className="bg-white text-black hover:bg-white/90">
                  <Eye className="mr-2 h-4 w-4" />
                  Explore Gallery
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <motion.div key={category} variants={staggerItem}>
              <Button
                variant={activeCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className="transition-all duration-300"
              >
                {category}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Gallery Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              variants={staggerItem}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="group"
            >
              <Card className="overflow-hidden feature-card p-0 cursor-pointer">
                {/* Image */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <div 
                    className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                  >
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Eye className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground italic">"{item.prompt}"</p>
                    </div>
                  </div>
                  
                  {/* Overlay */}
                  <motion.div
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary" className="backdrop-blur-sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="secondary" className="backdrop-blur-sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        {item.likes}
                      </span>
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {item.views}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Load More */}
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mt-12"
        >
          <Button variant="outline" size="lg" className="group">
            Load More Examples
            <motion.div
              className="ml-2"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.div>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}