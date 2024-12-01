const express = require('express');
const { db } = require('../config/firebase');
const router = express.Router();

// Validation middleware
const validateHealthData = async (req, res, next) => {
  const { uid, date } = req.body;

  if (!uid || !date) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      details: 'uid and date are required' 
    });
  }

  // Validate steps if present
  if (req.body.steps !== undefined) {
    const steps = Number(req.body.steps);
    if (isNaN(steps) || steps < 0 || steps > 100000) {
      return res.status(400).json({ 
        error: 'Invalid steps value',
        details: 'Steps must be between 0 and 100000'
      });
    }
  }

  // Validate heart rate if present
  if (req.body.heartRate !== undefined) {
    const heartRate = Number(req.body.heartRate);
    if (isNaN(heartRate) || heartRate < 30 || heartRate > 220) {
      return res.status(400).json({ 
        error: 'Invalid heart rate value',
        details: 'Heart rate must be between 30 and 220'
      });
    }
  }

  // Validate temperature if present
  if (req.body.temperature !== undefined) {
    const temp = Number(req.body.temperature);
    if (isNaN(temp) || temp < 35 || temp > 42) {
      return res.status(400).json({ 
        error: 'Invalid temperature value',
        details: 'Temperature must be between 35°C and 42°C'
      });
    }
  }

  // Validate sleep duration if present
  if (req.body.sleepDuration !== undefined) {
    const sleep = Number(req.body.sleepDuration);
    if (isNaN(sleep) || sleep < 0 || sleep > 24) {
      return res.status(400).json({ 
        error: 'Invalid sleep duration',
        details: 'Sleep duration must be between 0 and 24 hours'
      });
    }
  }

  // Validate self-report metrics if present
  const selfReportMetrics = ['mood', 'stress', 'hydration', 'nutrition'];
  for (const metric of selfReportMetrics) {
    if (req.body[metric] !== undefined) {
      const value = Number(req.body[metric]);
      if (isNaN(value) || value < 1 || value > 5) {
        return res.status(400).json({ 
          error: `Invalid ${metric} value`,
          details: `${metric} must be between 1 and 5`
        });
      }
    }
  }

  next();
};

// Calculate wellness score based on available metrics
const calculateWellnessScore = (data) => {
  let totalScore = 0;
  let availableMetrics = 0;

  // Wearable device metrics (40% of total score)
  if (data.steps !== undefined) {
    const stepsScore = Math.min(data.steps / 10000, 1) * 10;
    totalScore += stepsScore;
    availableMetrics++;
  }

  if (data.sleepDuration !== undefined) {
    const sleepScore = Math.min(data.sleepDuration / 8, 1) * 10;
    totalScore += sleepScore;
    availableMetrics++;
  }

  if (data.heartRate !== undefined) {
    // Assuming ideal heart rate is between 60-100
    const heartRateScore = data.heartRate >= 60 && data.heartRate <= 100 ? 10 : 5;
    totalScore += heartRateScore;
    availableMetrics++;
  }

  if (data.temperature !== undefined) {
    // Assuming ideal temperature is between 36.1-37.2
    const tempScore = data.temperature >= 36.1 && data.temperature <= 37.2 ? 10 : 5;
    totalScore += tempScore;
    availableMetrics++;
  }

  // Self-report metrics (60% of total score)
  const selfReportMetrics = ['mood', 'stress', 'hydration', 'nutrition'];
  for (const metric of selfReportMetrics) {
    if (data[metric] !== undefined) {
      const score = (data[metric] / 5) * 15; // Each self-report metric worth 15 points
      totalScore += score;
      availableMetrics++;
    }
  }

  // Calculate final score based on available metrics
  return availableMetrics > 0 ? (totalScore / (availableMetrics * 10)) * 100 : 0;
};

// POST endpoint to receive health data
router.post('/daily-data', validateHealthData, async (req, res) => {
  try {
    const { 
      uid, 
      date,
      source,
      steps,
      heartRate,
      temperature,
      sleepDuration,
      mood,
      stress,
      hydration,
      nutrition
    } = req.body;

    // Reference to the daily health document
    const healthDocRef = db.collection('daily_health_data')
      .doc(uid)
      .collection('dates')
      .doc(date);

    // Get existing data
    const existingDoc = await healthDocRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};

    // Merge new data with existing data
    const mergedData = {
      ...existingData,
      // Update only provided wearable metrics
      ...(steps !== undefined && { steps }),
      ...(heartRate !== undefined && { heart_rate: heartRate }),
      ...(temperature !== undefined && { temperature }),
      ...(sleepDuration !== undefined && { sleep_duration: sleepDuration }),
      
      // Update only provided self-report metrics
      ...(mood !== undefined && { mood }),
      ...(stress !== undefined && { stress }),
      ...(hydration !== undefined && { hydration }),
      ...(nutrition !== undefined && { nutrition }),
      
      last_updated: new Date(),
      last_update_source: source
    };

    // Calculate wellness score
    mergedData.wellness_score = calculateWellnessScore(mergedData);

    // Store merged data
    await healthDocRef.set(mergedData, { merge: true });

    // Store in wellness history if score changed
    if (mergedData.wellness_score !== existingData.wellness_score) {
      await db.collection('wellness_history')
        .doc(uid)
        .collection('scores')
        .doc(date)
        .set({
          score: mergedData.wellness_score,
          timestamp: new Date()
        });
    }

    res.json({ 
      message: 'Health data stored successfully',
      data: mergedData
    });

  } catch (error) {
    console.error('Error storing health data:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
});

// GET endpoint to retrieve daily health data
router.get('/daily-data/:uid/:date', async (req, res) => {
  try {
    const { uid, date } = req.params;

    const docRef = db.collection('daily_health_data')
      .doc(uid)
      .collection('dates')
      .doc(date);

    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ 
        error: 'Not found',
        details: 'No data found for this date' 
      });
    }

    res.json(doc.data());
  } catch (error) {
    console.error('Error retrieving health data:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
});

// GET endpoint to retrieve wellness history
router.get('/wellness-history/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const scoresSnapshot = await db.collection('wellness_history')
      .doc(uid)
      .collection('scores')
      .where('timestamp', '>=', startDate)
      .orderBy('timestamp', 'desc')
      .get();

    const scores = [];
    scoresSnapshot.forEach(doc => {
      scores.push({
        date: doc.id,
        ...doc.data()
      });
    });

    res.json(scores);
  } catch (error) {
    console.error('Error retrieving wellness history:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
});

module.exports = router;