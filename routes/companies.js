// routes about companies

const express = require("express");
const ExpressError = require("../expressError");
const db = require('../db')

const router = new express.Router()

// Get return of companies
router.get('/', async function(res, req, next) {
    try {
        const companyQuery = await db.query(
            `Select code, name, 
            FROM companies, 
            ORDER BY name`
        );
        return res.json({companies: companyQuery.rows})
    } catch(err){
        return next(err)
    }
});

// Get /[id] - return data about one company

router.get("/:code", async function(req, res, next){
    try {
        const companyQuery = await db.query(
            `SELECT code, name, description 
            FROM companies 
            WHERE code = $1`, 
        [req.params.code]);

        const invResult = await db.query(
            `SELECT id
            FROM invoices
            WHERE comp_code = $1`,
        [req.params.code]   
        );
        
        if (companyQuery.rows.length === 0){
            let notFoundError =  new Error(`There is no company with code ${req.params.code}`);
            notFoundError.status = 404;
            throw notFoundError;
        }
        return res.json({company: companyQuery.rows[0]});
    } catch (err) {
        return next(err)
    }
})

router.post('/', async function(req, res, next) {
    try{
        const result = await db.query(
            `INSERT INTO companies (code,name, description)
                VALUES ($1, $2, $3)
                RETURNING code, name, description`,
            [req.body])

        return res.status(201).json({cat: result.rows[0]});
    } catch (err) {
        return next(err)
    }
})

router.put("/:code", async function (req,res,next){
    try {
        if ("id" in req.body) {
            throw new ExpressError("Not allowed", 400)
        }
        let {name, description} = req.body;
        let code = req.params.code;
    
        const result = await db.query(
                `UPDATE companies
                SET name=$1, description=$2
                WHERE code = $3
                RETURNING code, name, description`,
            [name, description, code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`No such company: ${code}`, 404)
        } else {
            return res.json({"company": result.rows[0]});
        }
    }        
    catch (err) {
        return next(err);
    }        
});

router.delete('/:code', async function (req, res, next){
    try {

        const result = await db.query(
            `DELETE FROM companies 
            WHERE code = $1 
            RETURNING code`, [req.params.code]);
        
        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with id of ${req.params.code}`, 404)
        } else {
        return res.json({message:"Company deleted"});
        }
    } catch (err){
        return next(err)
    }
})

module.exports = router;