from http.server import BaseHTTPRequestHandler
from api._shared import cors_response, handle_options

DEMOS = {
    "tech_saas": {
        "id": "tech_saas",
        "label": "SaaS / B2B Tech",
        "company": "Nexus Analytics",
        "tagline": "Turn raw data into revenue decisions",
        "description": "B2B analytics platform for e-commerce teams. Helps mid-market retailers understand customer behavior and reduce churn through predictive insights.",
        "topic": "Why 73% of retailers are making pricing decisions with 3-month-old data",
        "analysis": {
            "company_summary": "Nexus Analytics turns behavioral data into predictive revenue signals for mid-market e-commerce. They replace spreadsheet gut-feel with real-time cohort intelligence.",
            "target_audience": {
                "primary": "E-commerce directors and heads of retention at $10M-$100M online retailers",
                "pain_points": ["Data always 2-3 months behind decisions", "Analytics tools require data science team", "Can't connect behavior signals to revenue impact"],
                "desires": ["Real-time visibility into customer health", "Actionable insights without hiring analysts", "Predict churn before it happens"]
            },
            "value_propositions": ["Real-time behavioral scoring", "No-code setup in 48 hours", "Proven 23% reduction in churn for customers"],
            "brand_voice_descriptors": ["Direct", "Data-confident", "Jargon-free"],
        },
        "generated": {
            "LinkedIn": {"content": "Your pricing team made a decision last Tuesday based on November data.\n\nIn e-commerce, 3-month-old data isn't insight — it's archaeology.\n\nWe audited 47 mid-market retailers. Average lag between customer behavior change and reporting visibility: 11.4 weeks.\n\nBy the time you see the trend, you've already lost the margin.\n\nNexus Analytics closes that gap to 72 hours.\n\nThe retailers we work with don't react to churn. They predict it.\n\n→ See how [link in bio]\n\n#EcommerceAnalytics #RetailTech #DataDriven #CustomerRetention", "notes": "Leads with a concrete, specific scenario before the stat"},
            "Twitter/X": {"content": "Your e-commerce team is making today's decisions with November's data.\n\n11-week average lag between behavior change and reporting visibility.\n\nThat's not analytics. That's archaeology.\n\n#EcommerceData", "notes": "Sharp, uses the archaeology metaphor as a hook"},
            "Email": {"content": "Subject: The 11-week problem killing your margins\nPreview: Your customers changed their behavior in November. You found out last week.\n\nHere's what we found analyzing 47 mid-market retailers:\n\nAverage time between a customer behavior shift and it appearing in your analytics dashboard: 11.4 weeks.\n\nThat means the churn you're seeing right now? You could have seen it in February.\n\nNexus Analytics was built specifically for this problem. Real-time behavioral scoring. No data science team required. Setup in 48 hours.\n\nBook a 20-minute demo and we'll show you your own data in real-time — before you commit to anything.\n\n→ Book demo", "notes": "Opens with the insight, not a feature pitch"}
        }
    },
    "fashion_ecom": {
        "id": "fashion_ecom",
        "label": "Fashion E-commerce",
        "company": "Maeven Studio",
        "tagline": "Slow fashion, sharp style",
        "description": "Sustainable fashion brand for conscious millennial women. Premium basics with transparent supply chain. Based in Berlin, ships across Europe.",
        "topic": "The real cost of fast fashion returns — and what we're doing differently",
        "analysis": {
            "company_summary": "Maeven Studio makes premium sustainable basics for women who want to buy less and wear more. Radical supply chain transparency is both their ethics and their marketing.",
            "target_audience": {
                "primary": "Conscious millennial women, 28-40, mid-to-high income, already reducing fast fashion",
                "pain_points": ["Greenwashing makes it hard to trust sustainability claims", "Quality basics that last are hard to find at accessible prices", "Fashion purchase guilt cycle"],
                "desires": ["Wardrobe that actually reduces decision fatigue", "Brands that prove claims, not just make them", "Style that improves rather than trends"]
            },
            "value_propositions": ["Full supply chain transparency — factory to shipping", "30-day wear guarantee or free alterations", "Carbon footprint shown on every product page"],
            "brand_voice_descriptors": ["Honest", "Understated", "Direct"],
        },
        "generated": {
            "LinkedIn": {"content": "The fashion industry returns 30% of online orders.\n\nMost brands absorb that as a cost of doing business.\n\nWe decided to understand it instead.\n\nAfter mapping our return patterns for 18 months, we found that 67% of our returns came from fit uncertainty — customers ordering two sizes.\n\nSo we built a fit guarantee: get professionally measured at home, we'll alter any piece that doesn't fit perfectly. Free. Once.\n\nReturns dropped 41%. Customer lifetime value increased 28%.\n\nSustainability isn't just about materials. It's about making clothes people actually keep.\n\n#SlowFashion #SustainableStyle #FashionTech", "notes": "Uses data to tell a story, not to show off"},
            "Instagram": {"content": "The return box is fashion's dirty secret.\n\n30% of everything ordered online comes back. Most of it ends up in landfill.\n\nWe spent 18 months figuring out why our customers return things.\n\nThe answer: fit uncertainty. Not changing minds. Not impulse regret. Just not being sure.\n\nSo now every Maeven piece comes with a fit guarantee. If it doesn't fit perfectly, we'll alter it. Free.\n\nKeeping clothes > buying new ones.\n\n📦 #SlowFashion #SustainableFashion #ConsciousStyle #FashionForGood #MaevenStudio #BerlinFashion #EthicalFashion #WardrobeEssentials", "notes": "Personal, story-driven, the hashtag strategy is sustainable-community focused"}
        }
    },
    "healthtech": {
        "id": "healthtech",
        "label": "HealthTech / Wellness",
        "company": "Forma Health",
        "tagline": "Preventive health intelligence for teams",
        "description": "B2B wellness platform for HR teams. Combines biometric screening, behavioral nudges, and predictive health scoring to reduce corporate healthcare costs.",
        "topic": "Why employee wellness programs fail — and what actually works",
        "analysis": {
            "company_summary": "Forma Health helps mid-to-large employers predict and prevent workforce health deterioration before it becomes expensive absenteeism or turnover.",
            "target_audience": {
                "primary": "HR directors and Chief People Officers at 500-5000 person companies",
                "pain_points": ["Wellness perks don't move health outcomes", "Can't tie wellness spend to ROI", "Reactive healthcare costs eating benefits budget"],
                "desires": ["Measurable ROI on wellness investment", "Employees who actually engage with health programs", "Reduce healthcare premium increases year-over-year"]
            },
            "value_propositions": ["Predictive health scoring per employee cohort", "Average $2,800 annual savings per engaged employee", "HR dashboard with leading indicators, not lag"],
            "brand_voice_descriptors": ["Evidence-based", "Empathetic", "Precise"],
        },
        "generated": {
            "LinkedIn": {"content": "The average company spends $1,200 per employee per year on wellness benefits.\n\nParticipation rate: 23%.\n\nWe analyzed 6 years of wellness program data across 140 enterprise clients.\n\nThe programs that failed shared one trait: they treated health as an employee responsibility.\n\nThe programs that worked shared a different trait: they treated health deterioration as a predictable pattern, not a personal failure.\n\nPrediction beats reaction. Every time.\n\nForma's approach: identify the 15% of employees whose health trajectory will drive 60% of next year's healthcare costs — and intervene now, not in Q3.\n\nROI on preventive intervention vs reactive care: 4.2x.\n\nReach out if you want to see how this works for your team size.\n\n#HRTech #EmployeeWellness #PeopleOps #WorkplaceHealth", "notes": "Leads with the failure pattern before presenting the solution"}
        }
    }
}

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        handle_options(self)
    def do_GET(self):
        cors_response(self, 200, {"demos": list(DEMOS.values())})
    def log_message(self, *args):
        pass
