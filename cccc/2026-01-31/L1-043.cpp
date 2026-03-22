// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805087447138304
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    int number, h, m, cnt = 0;
    double tm = 0;
    char op, t;
    map<int, int> hash;
    while (cin >> number >> op >> h >> t >> m)
    {
        if (!number)
        {
            cout << cnt << ' ' << fixed << setprecision(0) << (cnt ? tm / cnt : 0) << endl;
            cnt = 0;
            tm = 0;
            hash.clear();
        }

        if (op == 'S')
            hash[number] = h * 60 + m;

        else
        {
            if (!hash.count(number))
                continue;
            ++cnt;
            tm += h * 60 + m - hash[number];
            hash.erase(number);
        }
    }
}
