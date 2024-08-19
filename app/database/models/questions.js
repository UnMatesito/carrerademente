import mongoose from 'mongoose';

// Configuracion del schema
const questionsSchema = new mongoose.Schema({
    id: Number,
    question: String,
    option1: String,
    option2: String,
    option3: String,
    correct: String,
    type: Number,
    title: String
});

// Model de Questions
const Questions = mongoose.model('Questions', questionsSchema);

export { Questions, questionsSchema };
export default Questions