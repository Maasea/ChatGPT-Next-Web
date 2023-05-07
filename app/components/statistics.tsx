import { ErrorBoundary } from "./error";
import { requestDBAuth, requestDBUsage, requestDBUser } from "@/app/requests";
import ReactECharts from "echarts-for-react";
import Locale from "@/app/locales";
import { IconButton } from "./button";
import styles from "./statistics.module.scss";
import LeftArrowIcon from "@/app/icons/left-arrow.svg";
import RightArrowIcon from "@/app/icons/right-arrow.svg";
import { useCallback, useEffect, useState } from "react";
import { List, ListItem } from "@/app/components/ui-lib";
import { Loading } from "@/app/components/home";
import { useAccessStore } from "@/app/store";

interface DBResponse<T> {
  error: boolean;
  msg: string;
  data?: Array<T>;
}

interface UsageResponse {
  accessCode: string;
  model: string;
  prompt: number;
  completion: number;
  price: number;
  createDate: string;
}

const MONTH = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const currentDate = new Date();
function getDates() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const dates = [];
  const currentMonth = currentDate.getMonth() + 1;
  if (currentMonth < month) {
    const daysInMonth = new Date(year, currentMonth, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = `${year}-${currentMonth.toString().padStart(2, "0")}-${i
        .toString()
        .padStart(2, "0")}`;
      dates.push(date);
    }
  } else if (currentMonth === month) {
    for (let i = 1; i <= day; i++) {
      const date = `${year}-${month.toString().padStart(2, "0")}-${i
        .toString()
        .padStart(2, "0")}`;
      dates.push(date);
    }
  }
  return dates;
}
function calculatePriceByModel(arr: Array<UsageResponse>) {
  const datesObj: Record<string, any> = {};
  const dates = getDates();
  const models: Set<string> = new Set();
  const accessCodes: Set<string> = new Set();

  for (const cDate of dates) {
    if (!datesObj[cDate]) {
      datesObj[cDate] = {};
    }

    const it = datesObj[cDate];

    for (const item of arr) {
      const date = item.createDate.split("T")[0];

      if (date === cDate) {
        it.sum = (it.sum || 0) + item.price;

        if (item.accessCode) {
          it[item.accessCode] = (it[item.accessCode] || 0) + item.price;
          accessCodes.add(item.accessCode);
        }

        it[item.model] = (it[item.model] || 0) + item.price;
        models.add(item.model);
      }
    }
  }

  return {
    datesObj,
    models,
    accessCodes,
  };
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const monthName = MONTH[date.getMonth()];
  return `${day} ${monthName}`;
}
export function renderChart(
  chartData: Record<string, any>,
  option?: Record<string, any>,
) {
  const type = option?.type ?? "line";
  const series = Array.from(chartData.models).map((model: any) => {
    return {
      name: model,
      type: type,
      smooth: true,
      areaStyle: {},
      stack: "Total",
      label: {
        show: true,
      },
      data: Object.values(chartData.datesObj).map((v: any) =>
        parseFloat(v[model]?.toFixed(2) || 0),
      ),
    };
  });

  return {
    title: {
      text: "Daily usage (USD)",
      textStyle: {
        fontSize: 15,
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      valueFormatter: (value: string | number) => "$" + value,
    },
    toolbox: {
      show: true,
      feature: {
        magicType: {
          type: ["line", "bar"],
        },
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: [
      {
        type: "category",
        axisTick: {
          alignWithLabel: true,
        },
        data: Object.keys(chartData.datesObj).map((dateStr) =>
          formatDate(dateStr),
        ),
      },
    ],
    yAxis: [
      {
        type: "value",
        axisLabel: {
          formatter: "${value}",
        },
        minInterval: 0.01,
      },
    ],
    series: series,
  };
}

function DynamicChart(props: {
  chartOption: object;
  loading: boolean;
  setLoading: (status: boolean) => void;
  setUsage: (usage: object) => void;
  updateUsage: (
    startDate: string,
    endDate: string,
    all?: boolean,
    user?: string,
  ) => void;
  accessCode: string;
}) {
  const [currentMonth, setCurrentMonth] = useState(
    MONTH[currentDate.getMonth()],
  );
  // const [chartOption, setChartOption] = useState({});
  const { chartOption, updateUsage, accessCode } = props;
  const all = accessCode === "all";
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const startDate = new Date(Date.UTC(year, month - 1))
      .toISOString()
      .split("T")[0];
    const endDate = new Date(Date.UTC(year, month)).toISOString().split("T")[0];
    updateUsage(startDate, endDate, all, all ? "" : accessCode);
  }, [updateUsage]);

  function changeMonth(newIndex: number) {
    props.setLoading(true);
    currentDate.setMonth(currentDate.getMonth() + newIndex);
    setCurrentMonth(MONTH[currentDate.getMonth()]);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startDate = new Date(Date.UTC(year, month))
      .toISOString()
      .split("T")[0];
    const endDate = new Date(Date.UTC(year, month + 1))
      .toISOString()
      .split("T")[0];
    updateUsage(startDate, endDate, all, all ? "" : accessCode);
  }

  return (
    <div>
      <div className={styles["statistics-header"]}>
        <IconButton
          icon={<LeftArrowIcon className={styles["chevron"]} />}
          iconSize="24px"
          onClick={() => changeMonth(-1)}
        />
        <div className={styles["month-title"]} id="month-title">
          <label>{currentMonth}</label>
        </div>
        <IconButton
          icon={<RightArrowIcon className={styles["chevron"]} />}
          iconSize="24px"
          onClick={() => changeMonth(1)}
        />
      </div>
      <ReactECharts option={chartOption} notMerge={true} />
    </div>
  );
}

export function Statistics() {
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<Record<string, any>>({});
  const [users, setUsers] = useState([]);
  const [chartOption, setChartOption] = useState({});
  const [accessCode, setAccessCode] = useState(
    useAccessStore.getState().accessCode,
  );
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    requestDBAuth().then(async (res) => {
      const body = await res.json();
      setIsAdmin(body.data.isAdmin);
      if (body.data.isAdmin) {
        requestDBUser({}).then(async (res) => {
          const body = await res.json();
          setUsers(body.data.map((u: any) => u.accessCode));
        });
      }
    });
  }, []);

  const updateUsage = useCallback(
    (startDate: string, endDate: string, all?: boolean, user?: string) => {
      requestDBUsage(startDate, endDate, all, user).then(async (res) => {
        const data = ((await res.json()) as DBResponse<UsageResponse>).data!;
        const chartData = calculatePriceByModel(data);
        setChartOption(renderChart(chartData));
        const usage = data.reduce(
          (result, d) => {
            const price = d.price;
            const model = d.model;
            result.sum += price;
            result[model] = (result[model] || 0) + price;
            return result;
          },
          { sum: 0 } as Record<string, number>,
        );
        setUsage(usage);
        setLoading(false);
      });
    },
    [setLoading, setUsage],
  );

  return (
    <ErrorBoundary>
      <div className="window-header">
        <div className="window-header-title">
          <div className="window-header-main-title">
            {Locale.Statistics.Title}
          </div>
          <div className="window-header-sub-title">
            {Locale.Statistics.SubTitle}
          </div>
        </div>
      </div>
      {loading && <Loading noLogo />}
      <div
        className={styles["statistics"]}
        style={loading ? { display: "none" } : {}}
      >
        <DynamicChart
          chartOption={chartOption}
          loading={loading}
          setLoading={setLoading}
          setUsage={setUsage}
          updateUsage={updateUsage}
          accessCode={accessCode}
        />
        <div className={styles["usage"]}>
          {isAdmin && (
            <List>
              <ListItem title="User">
                <select
                  value={accessCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setAccessCode(code);
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    const startDate = new Date(Date.UTC(year, month))
                      .toISOString()
                      .split("T")[0];
                    const endDate = new Date(Date.UTC(year, month + 1))
                      .toISOString()
                      .split("T")[0];
                    updateUsage(startDate, endDate, code === "all", code);
                  }}
                >
                  <option key="all" value="all">
                    all
                  </option>
                  {users.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </ListItem>
            </List>
          )}
          <List>
            {Object.entries(usage).map(([k, v]) => (
              <ListItem key={k} title={k}>
                <label>${parseFloat(v.toFixed(2))}</label>
              </ListItem>
            ))}
          </List>
        </div>
      </div>
    </ErrorBoundary>
  );
}
