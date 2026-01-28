// https://www.luogu.com.cn/problem/P1874
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int tar;
    string str;
    cin >> str >> tar;
    str.insert(0, 1, '0');
    vvi dp(str.size(), vi(tar + 1, iINF));
    dp[0][0] = 0;
    for (int i = 1; i < str.size(); ++i)
        for (int j = 0; j <= tar; ++j)
        {
            ll tmp = 0;
            for (int k = 1; k <= i; ++k)
            {
                tmp = (str[i - k + 1] - '0') * pow(10, k - 1) + tmp;
                if (k > 7 && tmp > 100000 || j < tmp)
                    break;
                dp[i][j] = min(dp[i][j], dp[i - k][j - tmp] + 1);
            }
        }
    cout << (dp[str.size() - 1][tar] - 1 > 40 ? -1 : dp[str.size() - 1][tar] - 1);
}
