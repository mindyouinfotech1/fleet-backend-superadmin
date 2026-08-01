export const inspectionChecklist = {
  truck: [
    {
      categoryName: "Tyres",
      questions: [
        {
          question: "Kya front tyres ki condition sahi hai?",
          description: "Tyres me cut, crack ya excessive wear nahi hona chahiye.",
          expectedValue: "Yes",
        },
        {
          question: "Kya rear tyres ki condition sahi hai?",
          description: "Rear tyres damage-free hone chahiye.",
          expectedValue: "Yes",
        },
        {
          question: "Kya tyre pressure recommended level par hai?",
          description:
            "Manufacturer ke recommendation ke hisab se pressure hona chahiye.",
          expectedValue: "Yes",
        },
        {
          question: "Kya wheel nuts properly tight hain?",
          description: "Sabhi wheel nuts securely tight hone chahiye.",
          expectedValue: "Yes",
        },
        {
          question: "Kya stepney tyre available aur usable hai?",
          description:
            "Stepney achhi condition aur proper pressure me honi chahiye.",
          expectedValue: "Yes",
        },
      ],
    },
    {
      categoryName: "Documents",
      questions: [
        {
          question: "Kya RC available hai?",
          description: "Valid RC vehicle me honi chahiye.",
          expectedValue: "Yes",
        },
        {
          question: "Kya Insurance valid hai?",
          description: "Insurance expired nahi hona chahiye.",
          expectedValue: "Yes",
        },
        {
          question: "Kya PUC valid hai?",
          description: "Valid Pollution Certificate hona chahiye.",
          expectedValue: "Yes",
        },
        {
          question: "Kya Fitness Certificate valid hai?",
          description: "Fitness certificate valid hona chahiye.",
          expectedValue: "Yes",
        },
        {
          question: "Kya Permit valid hai?",
          description: "Vehicle permit valid hona chahiye.",
          expectedValue: "Yes",
        },
      ],
    },
  ],
};

