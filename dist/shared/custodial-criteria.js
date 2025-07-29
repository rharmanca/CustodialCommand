// Standardized Custodial Criteria System based on APPA standards
// This ensures consistent criteria across all inspection types
export const ratingDescriptions = [
    { stars: 1, label: "Unkempt Neglect", description: "Crisis" },
    { stars: 2, label: "Moderate Dinginess", description: "Reactive" },
    { stars: 3, label: "Casual Inattention", description: "Managed Care" },
    { stars: 4, label: "Ordinary Tidiness", description: "Comprehensive Care" },
    { stars: 5, label: "Orderly Spotlessness", description: "Showpiece Facility" }
];
export const inspectionCategories = [
    {
        key: 'floors',
        label: 'Floors',
        criteria: {
            5: "Floors and base moldings shine and/or are bright and clean; colors are fresh. No dirt buildup in corners or along walls.",
            4: "Floors and base moldings shine and/or are bright and clean. There is no buildup in corners along walls, but there can be up to two days' worth of dust, dirt, stains, or streaks.",
            3: "Floors are swept or vacuumed clean, but upon close observation there can be stains. A buildup of dirt and/or floor finish in corners and along walls can be seen. There are dull spots and/or matted carpet in walking lanes. Base molding is dull and dingy with streaks or splashes.",
            2: "Floors are swept or vacuumed clean, but are dull, dingy, and stained. There is an obvious buildup of dirt and/or floor finish in corners and along walls. There is a dull path and/or obviously matted carpet in the walking lanes. Base molding is dull and dingy with streaks or splashes.",
            1: "Floors and carpet are dull, dirty, dingy, scuffed, and/or matted. There is a conspicuous buildup of old dirt and/or floor finish in corners and along walls. Base molding is dirty, stained, and streaked. Gum, stains, dirt, dust balls, and trash are broadcast."
        }
    },
    {
        key: 'verticalHorizontalSurfaces',
        label: 'Vertical and Horizontal Surfaces',
        criteria: {
            5: "All vertical and horizontal surfaces have a freshly cleaned or polished appearance and have no accumulation of dust, dirt, marks, streaks, smudges, or fingerprints. Windows, glass, sills, frames, and related surfaces are free of dust, smudges, fingerprints etc.",
            4: "All vertical and horizontal surfaces are clean, but marks, dust, smudges, and fingerprints are noticeable upon close observation. Windows appear clean, but on close inspection marks, dust, cobwebs may be found. Sills and frames may have visible dust, dirt, or cobwebs on them.",
            3: "All vertical and horizontal surfaces have obvious dust, dirt, marks, smudges, and fingerprints. Windows frames are dusty and dirty, window glass is acceptable but it is obvious they have not been cleaned.",
            2: "All vertical and horizontal surfaces have conspicuous dust, dirt, smudges, fingerprints, and marks. At a quick glance windows are visibly dirty.",
            1: "All vertical and horizontal surfaces have major accumulations of dust, dirt, smudges, and fingerprints, all of which will be difficult to remove. Lack of attention is obvious. Window glass has obvious smudges, dirt, and marks. Frames are visibly dirty, dusty, and cobwebs are appearing."
        }
    },
    {
        key: 'ceiling',
        label: 'Ceiling',
        criteria: {
            5: "Ceilings and air vents are clean and free of dust/debris including cobwebs. No deficiencies.",
            4: "Ceilings and air vents are clean but dust/debris/cobwebs are noticeable upon close inspection.",
            3: "Ceilings and air vents have obvious dust/debris/cobwebs.",
            2: "Ceilings and air vents have conspicuous dust/debris/cobwebs.",
            1: "Ceilings and air vents have major accumulation of dust/debris/cobwebs."
        }
    },
    {
        key: 'restrooms',
        label: 'Restrooms',
        criteria: {
            5: "Consistent Monitoring: Restrooms must be regularly checked for use and cleanliness. Stocked and Maintained: Supplies (soap, paper products, etc.) must be fully stocked at all times. Spotless and Polished: Surfaces must be free of dirt, smudges, and water stains, with polished fixtures and mirrors. Graffiti-Free: No graffiti or defacement is present. Pleasant Odor: Restrooms must have a fresh, pleasant scent with no unpleasant odors.",
            4: "Routine Monitoring: Restrooms are checked regularly but may have minor lapses between inspections. Adequately Stocked: Supplies are generally available, though occasional low stock may occur. Clean but Lived-In: Surfaces are mostly clean, but minor smudges, water spots, or streaks may be present. Graffiti-Free: No significant graffiti, though faint markings or minor blemishes may be visible. Neutral Odor: The restroom has no strong odors—neither noticeably fresh nor unpleasant.",
            3: "Infrequent Monitoring: Restrooms are checked sporadically, leading to noticeable gaps in maintenance. Partially Stocked: Supplies are inconsistent—some items may be low or temporarily unavailable. Visible Wear: Surfaces show clear signs of use, including smudges, water spots, and minor grime. Minor Graffiti: Small or faint graffiti, scratches, or markings are present but not overwhelming. Slight Odor: A faint but noticeable stale or musty odor may be present, though not overpowering.",
            2: "Inconsistent Monitoring: Restrooms are rarely checked, leading to noticeable lapses in cleanliness and maintenance. Low Stock: Many supplies are missing, and those that remain are often running low. Dirty Surfaces: Surfaces show significant grime, stains, and streaks. Cleaning is overdue, and the overall appearance is visibly unkempt. Graffiti and Damage: Obvious graffiti, markings, or damage is present in several areas. Unpleasant Odor: A strong, unpleasant odor may be present, creating a noticeable discomfort for users.",
            1: "Rare or No Monitoring: Restrooms are infrequently checked or completely overlooked, leading to prolonged periods of neglect. No Stock: Essential supplies are completely absent or inadequate, with no immediate plans to restock. Filthy Surfaces: Surfaces are visibly dirty, with heavy stains, grime, and possibly mold or mildew. The overall environment is unsanitary. Extensive Graffiti and Damage: Graffiti, damage, or vandalism is widespread and has not been addressed. Strong, Offensive Odor: The restroom emits a strong, unpleasant odor, often foul, making the space uncomfortable and potentially unsanitary."
        }
    },
    {
        key: 'customerSatisfaction',
        label: 'Customer Satisfaction and Coordination',
        criteria: {
            5: "Proud of facilities, have a high level of trust for the custodial organization.",
            4: "Satisfied with custodial-related services, usually complimentary of custodial staff.",
            3: "Accustomed to basic level of custodial care. Generally able to perform mission duties. Lack of pride in physical environment.",
            2: "Generally critical of cost, responsiveness, and quality of custodial services.",
            1: "Consistent customer ridicule, mistrust of custodial services."
        }
    },
    {
        key: 'trash',
        label: 'Trash',
        criteria: {
            5: "Interior trash cans only hold daily waste, and are clean and free from odor. Dumpster area is free from litter, dumpsters are closed and if applicable after hours locked. Exterior grounds are free from litter, and exterior trash cans are well placed and maintained.",
            4: "Most interior trash cans only hold daily waste, and are largely clean and free from odor. Dumpster area is free from litter, dumpsters are closed and if applicable after hours locked. Exterior grounds have some litter but appear to be regularly tended to. Exterior trash cans are present, maintenance is frequency of emptying is unclear but acceptable.",
            3: "Interior trash is regularly cleared, some cans are ill maintained and have odor. Litter is present near dumpsters. Some litter is blowing around exterior and does not appear to be addressed on a regular basis.",
            2: "Trash containers smell, are stained and are frequently at capacity with old trash. Litter is present at dumpster area, dumpsters are poorly secured and contributing to exterior litter issues. Exterior litter is present and obvious.",
            1: "Trash containers smell, are stained and are overflowing with old trash. Dumpster areas are overflowing, litter is present near dumpsters and does not appear regularly cleaned. Exterior litter is present, and affecting the overall appearance of school."
        }
    },
    {
        key: 'projectCleaning',
        label: 'Project Cleaning',
        criteria: {
            5: "Break work scope is completed on time and regarded well by school based staff. Items are organized, prioritized, and presented by custodial team. Work exceeds expectations.",
            4: "Break work scope is mostly completed, however not on time and some work is shifted throughout year. Custodial team organizes most items. Work meets expectations.",
            3: "Priority break work items are completed, some are pushed to a later date. Items have been organized, prioritized, and presented by school and network. Most of the work meets expectations.",
            2: "Break work items must be requested and organized by school or network. Some items are not able to be completed. Completed work does not meet expectations.",
            1: "There are insufficient funds and staffing for project cleaning."
        }
    },
    {
        key: 'activitySupport',
        label: 'Activity Support',
        criteria: {
            5: "Activity (athletics, events, afterschool activities) support happens, and is planned along with the weekly routine. All comments are complimentary. Activity support compliments and does not impede regular work.",
            4: "Activity support happens, and is planned along with the weekly routine. Most comments are complimentary.",
            3: "Activity support happens, and is planned along with the weekly routine. Work at times do not meet customer expectations. Comments are generally complimentary. Activity support is at the expense of some other duties.",
            2: "Activity support happens, but staffing is not allocated. Support is done by redirecting staff away from normal custodial duties on a routine basis.",
            1: "Activity support happens ad hoc and often leads to duties not being completed."
        }
    },
    {
        key: 'safetyCompliance',
        label: 'Safety and Compliance',
        criteria: {
            5: "All chemicals are properly labeled, secured, and used in accordance with manufacturer instructions. Gas, propane, and highly combustible items are stored off site. Closets are organized and compliant with DHH regulations.",
            4: "Most chemicals are properly labeled, secured, and used in accordance with manufacturer instructions. Gas, propane, and highly combustible items are stored off site. Some disorganization and lack of tidiness in closets.",
            3: "Some chemicals are properly labeled, secured. Proper use of chemicals is not clear, visible misuse of chemicals such as buildup or material damage is present. Gas, propane, and highly combustible items are usually stored off site, though often after use left on campus. Closets are dirty, though organizational and safety systems appear to be present.",
            2: "Many chemicals not labeled. Proper use of chemicals is not clear, visible misuse of chemicals such as buildup or material damage is present. Gas, propane, and highly combustible items can be found on site. Closets are dirty, no apparent regular organization or safety assessment.",
            1: "Improper use and knowledge of chemicals is widespread. Closets are consistently disorganized, dirty, and lacking safety precautions. Combustible materials prohibited may be present. It is unclear if there are any organizational or safety systems in place."
        }
    },
    {
        key: 'equipment',
        label: 'Equipment',
        criteria: {
            5: "There is sufficient equipment, located within reasonable proximity to the responsible areas. Equipment is kept in good repair and is replaced as needed. Equipment is evaluated and optimized for the tasks at hand. Equipment is being used in facility with regularity.",
            4: "There is sufficient equipment, located within reasonable proximity to the responsible areas. Equipment is kept in good repair and is replaced as needed. Equipment is evaluated and optimized for the tasks at hand.",
            3: "There is sufficient equipment, located within reasonable proximity to the responsible areas. Equipment is replaced as needed, but may not be the optimal equipment for the tasks at hand.",
            2: "Equipment is frequently shared and transported and occasionally in disrepair, but there is a basic inventory of equipment on hand.",
            1: "There is no or minimal capital investment for custodial operations. Equipment is limited and in disrepair. Staff do not use available equipment and or not trained on operation."
        }
    },
    {
        key: 'monitoring',
        label: 'Monitoring',
        criteria: {
            5: "Real-Time Monitoring: A system is in place to track performance and cleanliness frequently, with some elements monitored in real time. Contract Alignment: Performance standards are fully aligned with the specifications outlined in the contract. Responsive Feedback: Feedback from schools is actively sought, quickly addressed, and incorporated into service improvements.",
            4: "Regular Monitoring: A system is in place to track performance and cleanliness at scheduled intervals, though not in real time. Contract Compliance: Performance generally aligns with contractual standards, with only occasional minor deviations. Feedback Incorporated: Feedback from schools is generally addressed in a timely manner and used to improve services.",
            3: "Periodic Monitoring: Performance is monitored intermittently, leading to some inconsistencies in cleanliness and efficiency. Partial Contract Compliance: Standards are mostly followed, but occasional oversights or delays occur. Reactive Feedback Response: Feedback from schools is addressed, but often with some delay.",
            2: "Infrequent Monitoring: Performance is rarely tracked, leading to noticeable inconsistencies. Contract Deviations: Several standards outlined in the contract are not being consistently met. Delayed Feedback Response: Feedback from schools is often ignored or addressed with significant delay.",
            1: "No Monitoring: Performance is rarely or never tracked, resulting in significant inefficiencies. Contract Non-Compliance: Most contractual standards are not being met. Disregarded Feedback: Feedback from schools is ignored or dismissed."
        }
    }
];
