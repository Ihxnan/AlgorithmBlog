// https://www.luogu.com.cn/problem/P1091
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    vi arr(n);
    cin >> arr;
    vi dp_p(n);
    for (int i = 0; i < n; ++i)
    {
        for (int j = 0; j < i; ++j)
            if (arr[j] < arr[i])
                dp_p[i] = max(dp_p[i], dp_p[j]);
        ++dp_p[i];
    }

    vi dp_b(n);
    for (int i = n - 1; i >= 0; --i)
    {
        for (int j = n - 1; j > i; --j)
            if (arr[j] < arr[i])
                dp_b[i] = max(dp_b[i], dp_b[j]);
        ++dp_b[i];
    }

    int ans = iINF;
    for (int i = 0; i < n; ++i)
        ans = min(ans, i + 1 - dp_p[i] + n - i - dp_b[i]);
    cout << ans << endl;
}
