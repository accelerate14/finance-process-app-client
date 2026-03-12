import Joi from 'joi';

export const employmentInfoSchema = Joi.object({
    // Status must match your UI dropdown exactly
    EmploymentStatus: Joi.string()
        .valid('Salaried', 'Self-Employed', 'Unemployed')
        .required()
        .messages({ 'any.only': 'Please select a valid employment status.' }),

    // Employer Name: Required ONLY if Salaried. 
    // If Unemployed, we allow it to be empty.
    EmployerName: Joi.string()
        .trim()
        .regex(/^[a-zA-Z\s-]+$/)
        .min(2)
        .max(100)
        .when('EmploymentStatus', {
            is: 'Salaried',
            then: Joi.required(),
            otherwise: Joi.allow('', null).optional(),
        })
        .messages({ 'any.required': 'Employer Name is required for salaried employees.',
            'string.pattern.base': 'Employer Name must only contain letters and spaces.'
         }),

    // Years at employer: 0 to 60 years
    YearsAtEmployer: Joi.number()
        .min(0)
        .max(60)
        .required()
        .messages({
            'number.min': 'Years at employer cannot be negative.',
            'number.max': 'Please enter a valid number of years (max 60).'
        }),

    // Monthly income: Must be positive, allowed up to 2 decimal places
    MonthlyIncome: Joi.number()
        .precision(2)
        .when('EmploymentStatus', {
            is: 'Salaried',
            // If salaried, must be a number, required, and at least 20,000
            then: Joi.number().min(20000).required(),
            // If not salaried (Self-Employed/Unemployed), 0 is okay or it can be empty
            otherwise: Joi.number().min(0).allow('', null).optional()
        })
        .messages({
            'number.base': 'Monthly income must be a valid number.',
            'number.min': 'Minimum 20,000 of monthly income is required for salaried profiles.',
        }),

    UserId: Joi.string().required(),
});

export const getEmploymentParamsSchema = Joi.object({
    borrowerId: Joi.string().required()
});