'use client';
import { useState, FormEvent, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

type ExpenseEntry = {
  id: number;
  date: string;
  category: string;
  amount: number;
};

const EXPENSE_CATEGORIES = [
  'Select Category',
  'Rent',
  'Food',
  'Transportation',
  'Entertainment',
  'Others'
] as const;

const CATEGORY_COLORS = {
  Rent: 'rgb(255, 99, 132)',
  Food: 'rgb(54, 162, 235)',
  Transportation: 'rgb(255, 206, 86)',
  Entertainment: 'rgb(75, 192, 192)',
  Others: 'rgb(153, 102, 255)',
};

type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

type ForecastData = {
  month: string;
  expenses: number;
  savings: number;
};

type Currency = {
  code: string;
  symbol: string;
  name: string;
};

const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

type Achievement = {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  completedDate?: string;
  icon: string;
  type: 'savings' | 'expense' | 'streak';
};

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-save',
    title: 'First Steps',
    description: 'Save your first $100',
    target: 100,
    progress: 0,
    completed: false,
    icon: '🌱',
    type: 'savings'
  },
  {
    id: 'savings-master',
    title: 'Savings Master',
    description: 'Save $1,000',
    target: 1000,
    progress: 0,
    completed: false,
    icon: '💰',
    type: 'savings'
  },
  {
    id: 'expense-reducer',
    title: 'Budget Champion',
    description: 'Reduce monthly expenses by 10%',
    target: 10,
    progress: 0,
    completed: false,
    icon: '📉',
    type: 'expense'
  },
  {
    id: 'consistent-saver',
    title: 'Consistent Saver',
    description: 'Maintain positive savings for 3 months',
    target: 3,
    progress: 0,
    completed: false,
    icon: '🎯',
    type: 'streak'
  }
];

type CategoryTotal = {
  [key in Exclude<ExpenseCategory, 'Select Category'>]: {
    amount: number;
    percentage: number;
  };
};

const CATEGORY_TIPS = {
  Transportation: [
    "Consider carpooling or using public transportation",
    "Switch to a fuel-efficient vehicle or use UberPool",
    "Look for monthly transit passes for better value",
    "Try biking or walking for short distances"
  ],
  Food: [
    "Cook at home instead of dining out",
    "Plan meals to avoid food waste",
    "Buy groceries in bulk when on sale",
    "Use grocery store loyalty programs"
  ],
  Rent: [
    "Negotiate your rent or consider moving to a cheaper area",
    "Find a roommate to share costs",
    "Look for utilities included in rent",
    "Consider long-term lease for better rates"
  ],
  Entertainment: [
    "Opt for free events or subscriptions with friends",
    "Limit impulse spending on movies and concerts",
    "Look for happy hour deals and early bird specials",
    "Use entertainment apps' family plans to split costs"
  ],
  Others: [
    "Track miscellaneous expenses to identify spending leaks",
    "Reduce unnecessary one-off purchases",
    "Look for multi-purpose items",
    "Wait 24 hours before making non-essential purchases"
  ]
} as const;

export default function Home() {
  const [income, setIncome] = useState<string>('');
  const [expenses, setExpenses] = useState<string>('');
  const [savingsGoal, setSavingsGoal] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Select Category');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [growthRate, setGrowthRate] = useState<number>(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [showAchievementAlert, setShowAchievementAlert] = useState(false);
  const [latestAchievement, setLatestAchievement] = useState<Achievement | null>(null);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal>({
    Transportation: { amount: 0, percentage: 0 },
    Food: { amount: 0, percentage: 0 },
    Rent: { amount: 0, percentage: 0 },
    Entertainment: { amount: 0, percentage: 0 },
    Others: { amount: 0, percentage: 0 }
  });
  const [highestCategory, setHighestCategory] = useState<{
    name: string;
    amount: number;
    percentage: number;
  } | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('budgetData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setIncome(data.income);
      setExpenses(data.expenses);
      setSavingsGoal(data.savingsGoal);
      setExpenseEntries(data.expenseEntries);
      if (data.expenseEntries.length > 0) {
        setIsCalculated(true);
      }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    const dataToStore = {
      income,
      expenses,
      savingsGoal,
      expenseEntries
    };
    localStorage.setItem('budgetData', JSON.stringify(dataToStore));
  }, [income, expenses, savingsGoal, expenseEntries]);

  // Load achievements from localStorage
  useEffect(() => {
    const savedAchievements = localStorage.getItem('budgetAchievements');
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    }
  }, []);

  // Save achievements to localStorage
  useEffect(() => {
    localStorage.setItem('budgetAchievements', JSON.stringify(achievements));
  }, [achievements]);

  // Check for achievements
  useEffect(() => {
    const checkAchievements = () => {
      const updatedAchievements = achievements.map(achievement => {
        const currentSavings = Number(income) - Number(expenses);
        let progress = 0;
        let completed = achievement.completed;

        switch (achievement.type) {
          case 'savings':
            progress = (currentSavings / achievement.target) * 100;
            if (currentSavings >= achievement.target && !completed) {
              completed = true;
              showNewAchievement(achievement);
            }
            break;

          case 'expense':
            if (expenseEntries.length >= 2) {
              const lastMonth = expenseEntries.slice(-30);
              const prevMonth = expenseEntries.slice(-60, -30);
              if (prevMonth.length > 0) {
                const prevTotal = prevMonth.reduce((sum, e) => sum + e.amount, 0);
                const currentTotal = lastMonth.reduce((sum, e) => sum + e.amount, 0);
                const reduction = ((prevTotal - currentTotal) / prevTotal) * 100;
                progress = (reduction / achievement.target) * 100;
                if (reduction >= achievement.target && !completed) {
                  completed = true;
                  showNewAchievement(achievement);
                }
              }
            }
            break;

          case 'streak':
            const monthsWithSavings = expenseEntries
              .reduce((months: Set<string>, entry) => {
                if (Number(income) - Number(expenses) > 0) {
                  months.add(entry.date.substring(0, 7));
                }
                return months;
              }, new Set<string>());
            
            progress = (monthsWithSavings.size / achievement.target) * 100;
            if (monthsWithSavings.size >= achievement.target && !completed) {
              completed = true;
              showNewAchievement(achievement);
            }
            break;
        }

        return {
          ...achievement,
          progress: Math.min(Math.max(progress, 0), 100),
          completed,
          completedDate: completed && !achievement.completedDate 
            ? new Date().toISOString() 
            : achievement.completedDate
        };
      });

      setAchievements(updatedAchievements);
    };

    checkAchievements();
  }, [income, expenses, expenseEntries]);

  const showNewAchievement = (achievement: Achievement) => {
    setLatestAchievement(achievement);
    setShowAchievementAlert(true);
    setTimeout(() => setShowAchievementAlert(false), 5000);
  };

  const handleAddExpense = (e: FormEvent) => {
    e.preventDefault();
    if (category === 'Select Category' || !expenseAmount) return;

    const newExpense: ExpenseEntry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      category,
      amount: Number(expenseAmount)
    };

    setExpenseEntries(prev => [...prev, newExpense]);
    setExpenses(prev => (Number(prev) + Number(expenseAmount)).toString());
    setCategory('Select Category');
    setExpenseAmount('');
    setIsCalculated(true);
  };

  const prepareChartData = () => {
    const categoryTotals: Record<string, number> = {};
    expenseEntries.forEach(entry => {
      categoryTotals[entry.category] = (categoryTotals[entry.category] || 0) + entry.amount;
    });

    return {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: Object.keys(categoryTotals).map(cat => CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS]),
        borderWidth: 1
      }]
    };
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'right' as const
      }
    }
  };

  // Calculate monthly totals for forecasting
  const calculateMonthlyTotals = () => {
    const monthlyData: Record<string, number> = {};
    expenseEntries.forEach(entry => {
      const month = entry.date.substring(0, 7); // YYYY-MM format
      monthlyData[month] = (monthlyData[month] || 0) + entry.amount;
    });
    return monthlyData;
  };

  // Generate forecast data
  const generateForecast = (): ForecastData[] => {
    const monthlyTotals = calculateMonthlyTotals();
    const months = Object.keys(monthlyTotals);
    
    if (months.length === 0) return [];

    // Calculate average monthly expense
    const avgExpense = Object.values(monthlyTotals)
      .reduce((sum, val) => sum + val, 0) / months.length;

    // Generate next 6 months
    const forecast: ForecastData[] = [];
    const lastMonth = months[months.length - 1] || new Date().toISOString().substring(0, 7);
    const [lastYear, lastMonthNum] = lastMonth.split('-').map(Number);

    for (let i = 1; i <= 6; i++) {
      const forecastMonth = new Date(lastYear, lastMonthNum - 1 + i, 1);
      const monthLabel = forecastMonth.toISOString().substring(0, 7);
      const growthMultiplier = 1 + (growthRate / 100);
      const projectedExpense = avgExpense * Math.pow(growthMultiplier, i);
      const projectedSavings = Number(income) - projectedExpense;

      forecast.push({
        month: monthLabel,
        expenses: projectedExpense,
        savings: projectedSavings
      });
    }

    return forecast;
  };

  // Prepare forecast chart data
  const forecastChartData = {
    labels: generateForecast().map(data => data.month),
    datasets: [
      {
        label: 'Projected Expenses',
        data: generateForecast().map(data => data.expenses),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.3
      },
      {
        label: 'Projected Savings',
        data: generateForecast().map(data => data.savings),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3
      }
    ]
  };

  const forecastChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: '6-Month Financial Forecast',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => `$${value.toLocaleString()}`
        }
      }
    }
  };

  // Export to PDF function
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Add title
      doc.setFontSize(20);
      doc.text('Budget Summary Report', pageWidth / 2, 15, { align: 'center' });
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

      // Add financial summary
      doc.setFontSize(12);
      const summaryData = [
        ['Total Income', `$${Number(income).toLocaleString()}`],
        ['Total Expenses', `$${Number(expenses).toLocaleString()}`],
        ['Savings Goal', `$${Number(savingsGoal).toLocaleString()}`],
        ['Remaining', `$${(Number(income) - Number(expenses)).toLocaleString()}`],
      ];

      autoTable(doc, {
        head: [['Category', 'Amount']],
        body: summaryData,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });

      // Add expense breakdown
      const expenseData = expenseEntries.map(entry => [
        entry.date,
        entry.category,
        `$${entry.amount.toLocaleString()}`,
      ]);

      autoTable(doc, {
        head: [['Date', 'Category', 'Amount']],
        body: expenseData,
        startY: doc.lastAutoTable.finalY + 10,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });

      // Add pie chart if available
      if (expenseEntries.length > 0) {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (canvas) {
          const chartImage = canvas.toDataURL('image/png');
          const chartWidth = 80;
          const chartHeight = 80;
          doc.addImage(
            chartImage,
            'PNG',
            (pageWidth - chartWidth) / 2,
            doc.lastAutoTable.finalY + 10,
            chartWidth,
            chartHeight
          );
        }
      }

      // Save the PDF
      doc.save('budget-summary.pdf');
      showNotificationMessage('PDF exported successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotificationMessage('Error generating PDF', true);
    }
  };

  // Export to CSV function
  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Category', 'Amount'];
      const csvData = expenseEntries.map(entry => 
        [entry.date, entry.category, entry.amount.toString()]
      );
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'expense-data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotificationMessage('CSV exported successfully!');
    } catch (error) {
      console.error('Error generating CSV:', error);
      showNotificationMessage('Error generating CSV', true);
    }
  };

  // Notification helper
  const showNotificationMessage = (message: string, isError = false) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Calculate category totals and highest spending
  useEffect(() => {
    if (expenseEntries.length === 0) return;

    // Calculate totals for each category
    const totals = expenseEntries.reduce((acc, entry) => {
      if (entry.category !== 'Select Category') {
        acc[entry.category] = {
          amount: (acc[entry.category]?.amount || 0) + entry.amount,
          percentage: 0
        };
      }
      return acc;
    }, {} as CategoryTotal);

    // Calculate percentages and find highest
    const totalExpenses = Object.values(totals).reduce((sum, cat) => sum + cat.amount, 0);
    let highest = { name: '', amount: 0, percentage: 0 };

    Object.entries(totals).forEach(([category, data]) => {
      const percentage = (data.amount / totalExpenses) * 100;
      totals[category as keyof CategoryTotal].percentage = percentage;

      if (data.amount > highest.amount) {
        highest = {
          name: category,
          amount: data.amount,
          percentage: percentage
        };
      }
    });

    setCategoryTotals(totals);
    setHighestCategory(highest);
  }, [expenseEntries]);

  // Get random tip for a category
  const getRandomTip = (category: keyof typeof CATEGORY_TIPS): string => {
    const tips = CATEGORY_TIPS[category];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="mt-10 px-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800">
            Budget Tracker
          </h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Forms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Income and Savings Form */}
            <form className="w-full space-y-4 p-6 bg-white rounded-lg shadow-sm">
              <div className="relative">
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="Total Income"
                  className="border rounded-lg p-2 w-full pl-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {CURRENCIES[0].symbol}
                </span>
              </div>
              <input
                type="number"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                placeholder="Savings Goal"
                className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </form>

            {/* Expense Entry Form */}
            <form onSubmit={handleAddExpense} className="w-full space-y-4 p-6 bg-white rounded-lg shadow-sm">
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="border rounded-lg p-2 flex-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Amount"
                  className="border rounded-lg p-2 w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </form>
          </div>

          {/* Data Display Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expenses Table */}
            <div className="w-full overflow-x-auto bg-white rounded-lg shadow-sm">
              {expenseEntries.length > 0 && (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Category</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseEntries.map((entry, index) => (
                      <tr 
                        key={entry.id}
                        className={`${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-gray-100 transition-colors`}
                      >
                        <td className="px-4 py-2 text-sm text-gray-600">{entry.date}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{entry.category}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 text-right">
                          ${entry.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pie Chart */}
            {expenseEntries.length > 0 && (
              <div className="w-full bg-white rounded-lg shadow-sm p-4">
                <div className="aspect-square">
                  <Pie data={prepareChartData()} options={chartOptions} />
                </div>
              </div>
            )}
          </div>

          {/* Budget Summary */}
          {isCalculated && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-medium text-gray-600">Total Income</h3>
                <p className="text-2xl font-semibold text-green-600">
                  ${Number(income).toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-medium text-gray-600">Total Expenses</h3>
                <p className="text-2xl font-semibold text-red-600">
                  ${Number(expenses).toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-medium text-gray-600">Remaining</h3>
                <p className={`text-2xl font-semibold ${
                  Number(income) - Number(expenses) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  ${(Number(income) - Number(expenses)).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Forecasting Section */}
          {expenseEntries.length > 0 && (
            <section className="bg-blue-50 rounded-lg p-6 mt-8 w-full max-w-3xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Financial Forecast
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Expense Growth Rate: {growthRate}%
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">-10%</span>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(Number(e.target.value))}
                    className="flex-grow h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">+10%</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <Line data={forecastChartData} options={forecastChartOptions} />
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Average Monthly Expenses
                  </h3>
                  <p className="text-2xl font-semibold text-red-600">
                    ${calculateMonthlyTotals() 
                      ? (Object.values(calculateMonthlyTotals())
                          .reduce((sum, val) => sum + val, 0) / 
                          Object.keys(calculateMonthlyTotals()).length)
                          .toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : '0'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Projected Monthly Savings
                  </h3>
                  <p className={`text-2xl font-semibold ${
                    generateForecast()[5]?.savings >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    ${generateForecast()[5]?.savings.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0'}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Export Buttons */}
      {expenseEntries.length > 0 && (
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={exportToPDF}
            className="bg-green-500 text-white rounded-lg px-6 py-2 hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            Export as PDF
          </button>
          
          <button
            onClick={exportToCSV}
            className="bg-blue-500 text-white rounded-lg px-6 py-2 hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
              />
            </svg>
            Export as CSV
          </button>
        </div>
      )}

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-up">
          {notificationMessage}
        </div>
      )}

      {/* Achievements Section */}
      <section className="flex flex-col items-center bg-purple-50 rounded-lg p-6 mt-8 w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-purple-800 mb-6">
          Savings Achievements
        </h2>
        
        <div className="w-full space-y-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`${
                achievement.completed ? 'bg-purple-100' : 'bg-white'
              } rounded-lg p-4 shadow-sm transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {achievement.description}
                    </p>
                  </div>
                </div>
                {achievement.completed && (
                  <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                    Completed!
                  </span>
                )}
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(achievement.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      achievement.completed 
                        ? 'bg-purple-500' 
                        : 'bg-purple-300'
                    }`}
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
                {achievement.completedDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Completed on: {new Date(achievement.completedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Achievement Alert */}
      {showAchievementAlert && latestAchievement && (
        <div className="fixed bottom-4 right-4 bg-purple-500 text-white px-6 py-4 rounded-lg shadow-lg animate-fade-in-up">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{latestAchievement.icon}</span>
            <div>
              <h4 className="font-semibold">Achievement Unlocked!</h4>
              <p className="text-sm">{latestAchievement.title}</p>
            </div>
          </div>
        </div>
      )}

      {/* Highest Spending Category Card */}
      {highestCategory && expenseEntries.length > 0 && (
        <div className="w-full max-w-md mx-auto mt-8">
          <div className="bg-orange-50 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">
              Highest Spending Category
            </h3>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {highestCategory.name}
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  {highestCategory.percentage.toFixed(1)}% of total expenses
                </p>
              </div>
              <p className="text-2xl font-semibold text-orange-600">
                ${highestCategory.amount.toLocaleString()}
              </p>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-3">
              {Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b.amount - a.amount)
                .map(([category, data]) => (
                  <div key={category} className="relative">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{category}</span>
                      <span>${data.amount.toLocaleString()} ({data.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-orange-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-orange-500"
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            {/* Updated Spending Tips */}
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-white rounded-lg border border-orange-100">
                <h4 className="font-medium text-orange-800 mb-2">
                  💡 Tips for {highestCategory.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {getRandomTip(highestCategory.name as keyof typeof CATEGORY_TIPS)}
                </p>
              </div>

              {/* Additional Tips for Other High-Spending Categories */}
              {Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b.amount - a.amount)
                .slice(1, 3) // Get next 2 highest categories
                .filter(([category, data]) => data.percentage > 15) // Only show if > 15%
                .map(([category]) => (
                  <div 
                    key={category}
                    className="p-4 bg-white rounded-lg border border-orange-100 opacity-75"
                  >
                    <h4 className="font-medium text-orange-800 mb-2">
                      💡 Tips for {category}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {getRandomTip(category as keyof typeof CATEGORY_TIPS)}
                    </p>
                  </div>
                ))}
            </div>

            {/* General Advice Based on Spending Pattern */}
            {highestCategory.percentage > 40 && (
              <div className="mt-4 p-3 bg-orange-100 rounded-lg text-sm text-orange-800">
                ⚠️ Your {highestCategory.name.toLowerCase()} spending is quite high 
                ({highestCategory.percentage.toFixed(1)}% of total). 
                Consider rebalancing your budget for better financial health.
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="mt-10 py-6 border-t border-gray-200">
        <p className="text-center text-sm text-gray-600">
          © {new Date().getFullYear()} Budget Tracker. All rights reserved.
        </p>
      </footer>
    </div>
  );
} 