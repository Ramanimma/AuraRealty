
-- Create listings table
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  price TEXT NOT NULL,
  address TEXT NOT NULL,
  beds INTEGER NOT NULL DEFAULT 0,
  baths INTEGER NOT NULL DEFAULT 0,
  sqft INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  main_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view listings)
CREATE POLICY "Listings are publicly readable"
  ON public.listings
  FOR SELECT
  USING (true);

-- Seed with existing property data
INSERT INTO public.listings (title, price, address, beds, baths, sqft, description, main_image) VALUES
  ('627 Pheasant Hill Ln', '$2,770/mo', '627 Pheasant Hill Ln, Georgetown, TX 78628', 4, 3, 3144, 'Beautifully designed 4-bedroom, 3.5-bath home with a versatile flex space, dedicated media room, and expansive game room. The open-concept layout features a stunning kitchen with quartz countertops, large island, stainless steel appliances, and walk-in pantry. The spacious primary suite offers a spa-like bath with double vanity, soaking tub, walk-in shower, and oversized closet. Enjoy abundant natural light, an extended covered patio, and a 2-car garage. Located in a resort-style community with pool, clubhouse, playground, and BBQ area.', '/assets/property1.jpg'),
  ('12706 Bloomington Dr', '$2,770/mo', '12706 Bloomington Dr, Austin, TX 78748', 4, 3, 2710, 'Beautiful two-story home featuring 4 spacious bedrooms and 3 full bathrooms with 2,710 sq ft of living space on an 8,041 sq ft lot. The open layout includes granite countertops, a breakfast bar, French doors, and energy-efficient appliances. The primary suite on the main floor offers added comfort and accessibility. Conveniently located just 20 minutes from downtown Austin and Austin-Bergstrom International Airport. A perfect blend of suburban tranquility and city accessibility.', '/assets/property2.jpeg'),
  ('7890 Congress Ave', '$675,000', '7890 Congress Ave, Austin, TX', 3, 2, 2100, 'A beautifully updated home in the heart of South Austin. This charming three-bedroom residence blends modern finishes with classic character. Enjoy a renovated kitchen, spacious living areas, and a private backyard oasis. Walking distance to local favorites on South Congress Avenue, with easy access to downtown and Lady Bird Lake trails.', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop'),
  ('1200 Westlake Dr', '$1,475,000', '1200 Westlake Dr, Austin, TX', 5, 5, 5800, 'This architectural masterpiece in Westlake Hills offers the pinnacle of luxury living. With five bedrooms and five bathrooms across nearly 6,000 square feet, every detail has been meticulously crafted. The home features a state-of-the-art home theater, wine cellar, and three-car garage. Expansive outdoor living with infinity pool and breathtaking views of the Texas hill country.', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop'),
  ('3345 Mueller Blvd', '$540,000', '3345 Mueller Blvd, Austin, TX', 3, 2, 1850, 'A modern gem in the vibrant Mueller community. This energy-efficient home features clean lines, an open-concept living area, and a sun-drenched kitchen with breakfast nook. The primary suite includes a walk-in closet and contemporary bath. Enjoy community amenities including parks, trails, a lake, and the nearby Thinkery children''s museum.', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop'),
  ('9012 South Lamar Blvd', '$725,000', '9012 South Lamar Blvd, Austin, TX', 4, 3, 2600, 'A sophisticated four-bedroom home in one of Austin''s most desirable corridors. This move-in-ready property features designer finishes throughout, including a custom kitchen, spa-inspired bathrooms, and engineered hardwood floors. The backyard features a mature pecan tree and space for a future pool. Minutes from Barton Springs, Zilker Park, and the best of South Lamar dining.', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=600&h=400&fit=crop');
