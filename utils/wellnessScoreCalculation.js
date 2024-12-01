function calculateWellnessScore(data) {
    // Helper function to cap a value at 100
    const cap100 = (value) => Math.min(value, 100);
  
    // 1. Age Score
    const ageScore = 100 - (data.age / 1.2);
  
    // 2. Activity Score
    const stepScore = cap100((data.steps / 10000) * 100);
    const exerciseScore = cap100((data.exerciseDuration / 60) * 100);
    const activityScore = (0.6 * stepScore) + (0.4 * exerciseScore);
  
    // 3. Sleep Score
    const sleepScore = cap100((data.sleepDuration / 8) * 100);
  
    // 4. Heart Rate Score
    let heartRateScore;
    if (data.heartRate < 60) {
      heartRateScore = 100 - ((60 - data.heartRate) * 2);
    } else if (data.heartRate >= 60 && data.heartRate <= 100) {
      heartRateScore = 100;
    } else {
      heartRateScore = 100 - ((data.heartRate - 100) * 2);
    }
    heartRateScore = cap100(heartRateScore);
  
    // 5. Self-Reported Score
    const moodScore = data.mood * 20;
    const stressScore = data.stress * 20;
    const hydrationScore = data.hydration * 20;
    const nutritionScore = data.nutrition * 20;
    const selfReportedScore = (0.3 * moodScore) + (0.3 * stressScore) + (0.2 * hydrationScore) + (0.2 * nutritionScore);
  
    // Calculate final Wellness Score
    const wellnessScore = (0.15 * ageScore) + (0.25 * activityScore) + (0.25 * sleepScore) + (0.15 * heartRateScore) + (0.20 * selfReportedScore);
  
    return Math.round(wellnessScore * 100) / 100; // Round to 2 decimal places
  }
  
  // Function to handle missing data
  function calculateAdjustedWellnessScore(data) {
    const availableMetrics = {
      age: data.age !== undefined,
      activity: data.steps !== undefined && data.exerciseDuration !== undefined,
      sleep: data.sleepDuration !== undefined,
      heartRate: data.heartRate !== undefined,
      selfReported: data.mood !== undefined && data.stress !== undefined && data.hydration !== undefined && data.nutrition !== undefined
    };
  
    const availableMetricsCount = Object.values(availableMetrics).filter(Boolean).length;
  
    if (availableMetricsCount === 5) {
      return calculateWellnessScore(data);
    }
  
    // Adjust weights based on available metrics
    const weights = {
      age: availableMetrics.age ? 0.1 : 0,
      activity: availableMetrics.activity ? 0.3 : 0,
      sleep: availableMetrics.sleep ? 0.25 : 0,
      heartRate: availableMetrics.heartRate ? 0.15 : 0,
      selfReported: availableMetrics.selfReported ? 0.35 : 0
    };
  
    // Normalize weights
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(weights).forEach(key => {
      weights[key] /= totalWeight;
    });
  
    // Calculate scores for available metrics
    let adjustedScore = 0;
  
    if (availableMetrics.age) {
      adjustedScore += weights.age * (100 - (data.age / 1.2));
    }
  
    if (availableMetrics.activity) {
      const stepScore = Math.min((data.steps / 10000) * 100, 100);
      const exerciseScore = Math.min((data.exerciseDuration / 60) * 100, 100);
      adjustedScore += weights.activity * ((stepScore + exerciseScore) / 2);
    }
  
    if (availableMetrics.sleep) {
      adjustedScore += weights.sleep * Math.min((data.sleepDuration / 8) * 100, 100);
    }
  
    if (availableMetrics.heartRate) {
      let heartRateScore;
      if (data.heartRate < 60) {
        heartRateScore = 100 - ((60 - data.heartRate) * 2);
      } else if (data.heartRate >= 60 && data.heartRate <= 100) {
        heartRateScore = 100;
      } else {
        heartRateScore = 100 - ((data.heartRate - 100) * 2);
      }
      adjustedScore += weights.heartRate * Math.min(heartRateScore, 100);
    }
  
    if (availableMetrics.selfReported) {
      const selfReportedScore = (data.mood * 20 + data.stress * 20 + data.hydration * 20 + data.nutrition * 20) / 4;
      adjustedScore += weights.selfReported * selfReportedScore;
    }
  
    return Math.round(adjustedScore * 100) / 100; // Round to 2 decimal places
  }
  
  module.exports = {
    calculateWellnessScore,
    calculateAdjustedWellnessScore
  };