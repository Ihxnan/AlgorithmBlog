// https://www.luogu.com.cn/problem/P1544
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n, t;
    string ts, te;
    cin >> ts >> te >> n;

    auto to_minute = [](string str) -> int {
        int colon = str.find(':');
        return stoi(str.substr(0, colon)) * 60 + stoi(str.substr(colon + 1));
    };

    t = to_minute(te) - to_minute(ts);

    vvi dp(n + 1, vi(t + 1));
    for (int i = 1, ti, ci, pi; i <= n; ++i)
    {
        cin >> ti >> ci >> pi;
        for (int j = 0; j <= t; ++j)
        {
            dp[i][j] = dp[i - 1][j];
            if (j >= ti)
            {
                if (pi == 0)
                    dp[i][j] = max(dp[i][j], dp[i][j - ti] + ci);
                for (int k = 1; k <= pi && j >= k * ti; ++k)
                    dp[i][j] = max(dp[i][j], dp[i - 1][j - k * ti] + k * ci);
            }
        }
    }

    cout << dp[n][t];
}
