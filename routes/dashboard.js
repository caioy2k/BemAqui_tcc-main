// DASHBOARD FUTURO PARA IMPACTO PRONTO (USAR DEPOIS)



// const express = require("express");
// const router = express.Router();

// const User = require("../models/user");
// const Trade = require("../models/trade");

// router.get("/public", async (req, res) => {
//   try {
//     const [
//       totalUsers,
//       recycledKgResult,
//       coinsGeneratedResult,
//       productsDeliveredResult,
//       recyclingByMaterialResult,
//       familiesMonthlyResult
//     ] = await Promise.all([
//       User.countDocuments(),

//       Trade.aggregate([
//         { $match: { status: "concluido" } },
//         { $unwind: "$recyclablesOffered" },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: "$recyclablesOffered.quantity" }
//           }
//         }
//       ]),

//       Trade.aggregate([
//         { $match: { status: "concluido" } },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: { $ifNull: ["$totalRecyclingPoints", 0] } }
//           }
//         }
//       ]),

//       Trade.aggregate([
//         { $match: { status: "concluido" } },
//         { $unwind: "$benefitsRequested" },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: "$benefitsRequested.quantity" }
//           }
//         }
//       ]),

//       Trade.aggregate([
//         { $match: { status: "concluido" } },
//         { $unwind: "$recyclablesOffered" },
//         {
//           $group: {
//             _id: "$recyclablesOffered.recyclableName",
//             value: { $sum: "$recyclablesOffered.quantity" }
//           }
//         },
//         { $sort: { value: -1 } },
//         {
//           $project: {
//             _id: 0,
//             label: { $ifNull: ["$_id", "Não informado"] },
//             value: 1
//           }
//         }
//       ]),

//       Trade.aggregate([
//         { $match: { status: "concluido", completedAt: { $ne: null } } },
//         {
//           $group: {
//             _id: {
//               year: { $year: "$completedAt" },
//               month: { $month: "$completedAt" }
//             },
//             beneficiaries: { $addToSet: "$beneficiaryId" }
//           }
//         },
//         {
//           $project: {
//             _id: 0,
//             year: "$_id.year",
//             month: "$_id.month",
//             value: { $size: "$beneficiaries" }
//           }
//         },
//         { $sort: { year: 1, month: 1 } }
//       ])
//     ]);

//     const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

//     const familiesMonthly = familiesMonthlyResult.map(item => ({
//       label: `${monthNames[item.month - 1]}/${String(item.year).slice(-2)}`,
//       value: item.value
//     }));

//     res.json({
//       summary: {
//         familiesHelped: totalUsers || 0,
//         recycledKg: recycledKgResult[0]?.total || 0,
//         coinsGenerated: coinsGeneratedResult[0]?.total || 0,
//         productsDelivered: productsDeliveredResult[0]?.total || 0
//       },
//       charts: {
//         recyclingByMaterial: recyclingByMaterialResult || [],
//         familiesMonthly: familiesMonthly || []
//       }
//     });
//   } catch (error) {
//     console.error("Erro ao carregar dashboard público:", error);
//     res.status(500).json({ error: "Erro ao carregar dados do dashboard." });
//   }
// });

// module.exports = router;