// https://www.luogu.com.cn/problem/P1064
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

// 定义商品结构体，包含价格，重要程度和依赖关系
struct Good
{
    int price, value, wei;
    Good(int p = 0, int v = 0, int w = 0) : price(p), value(v), wei(w) {}
};

void solve()
{
    int n, m;
    cin >> n >> m;

    // 排序->所有附件紧跟着其依赖的商品
    vector<Good> things(m + 1), tmp, arr(1);
    for (int i = 1, a, b, c; i <= m; ++i)
    {
        cin >> a >> b >> c;
        if (c)
            tmp.emplace_back(a, b, c);
        else
            things[i] = {a, b, c};
    }
    sort(all(tmp), [](const Good &a, const Good &b)
         { return a.wei < b.wei; });
    int idx = 0;
    for (int i = 1; i <= m; ++i)
    {
        if (things[i].price == 0)
            continue;
        arr.emplace_back(things[i]);
        while (idx < tmp.size() && tmp[idx].wei == i)
            arr.emplace_back(tmp[idx++]);
    }
    
    vvi dp(m + 1, vi(n + 1)); // dp[i][j]表示前i件商品j元钱的最大价值
    for (int i = 1; i <= m; ++i)
    {
        for (int j = 0; j <= n; ++j)
        {
            // 主件:
            // dp[i][j] = max(dp[i - 1][j - arr[i].price] + arr[i].price * arr[i].value, dp[i - 1][j])
            if (!arr[i].wei)
            {
                dp[i][j] = dp[i - 1][j];
                if (j >= arr[i].price)
                    dp[i][j] = max(dp[i][j], dp[i - 1][j - arr[i].price] + arr[i].price * arr[i].value);
            }
            else
            {
                // 附件1: 如果买的话必须同时把主件一起购买
                // dp[i][j] = max(dp[i - 1][j], dp[i - 2][j - arr[i].price - arr[i - 1].price] + arr[i].price * arr[i].value + arr[i - 1].price * arr[i - 1].value);
                if (!arr[i - 1].wei)
                {
                    dp[i][j] = dp[i - 1][j];
                    if (j >= arr[i].price + arr[i - 1].price)
                        dp[i][j] = max(dp[i][j], dp[i - 2][j - arr[i].price - arr[i - 1].price] + arr[i].price * arr[i].value + arr[i - 1].price * arr[i - 1].value);
                }
                // 附件2: 如果买的话必须同时把主件一起购买, 比附件1多一个判断三个一起买的情况
                else
                {
                    dp[i][j] = dp[i - 1][j];
                    if (j >= arr[i].price + arr[i - 2].price)
                        dp[i][j] = max(dp[i][j], dp[i - 3][j - arr[i].price - arr[i - 2].price] + arr[i].price * arr[i].value + arr[i - 2].price * arr[i - 2].value);
                    if (j >= arr[i].price + arr[i - 1].price + arr[i - 2].price)
                        dp[i][j] = max(dp[i][j], dp[i - 3][j - arr[i].price - arr[i - 1].price - arr[i - 2].price] + arr[i].price * arr[i].value + arr[i - 1].price * arr[i - 1].value + arr[i - 2].price * arr[i - 2].value);
                }
            }
        }
    }

    cout << dp[m][n] << endl;
}
